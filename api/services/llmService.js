import { getGemini, getOpenAI } from '../config/ai.js';

/**
 * Parse JSON response from AI models
 */
const parseJSONResponse = (text) => {
  try {
    const cleanText = text.trim()
      .replace(/^```json/i, '')
      .replace(/^```/i, '')
      .replace(/```$/, '')
      .trim();
    return JSON.parse(cleanText);
  } catch (err) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (_) {}
    }
    throw new Error(`Failed to parse AI response as JSON`);
  }
};

/**
 * Execute prompts on active LLM provider
 */
const generateStructuredJSON = async (systemInstructions, userPrompt, mockDataGenerator) => {
  const gemini = getGemini();
  const openai = getOpenAI();

  const combinedPrompt = `${systemInstructions}\n\nINPUT DATA:\n${userPrompt}\n\nReturn ONLY a JSON object.`;

  // Gemini
  if (gemini) {
    try {
      console.log('[LLM] Calling Gemini API...');
      const model = gemini.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(combinedPrompt);
      return parseJSONResponse(result.response.text());
    } catch (err) {
      console.error(`[LLM Error] Gemini failed: ${err.message}. Trying OpenAI...`);
    }
  }

  // OpenAI
  if (openai) {
    try {
      console.log('[LLM] Calling OpenAI API...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });
      return parseJSONResponse(response.choices[0].message.content);
    } catch (err) {
      console.error(`[LLM Error] OpenAI failed: ${err.message}. Using mock...`);
    }
  }

  // Mock fallback
  console.log('[LLM] Running in mock mode');
  return mockDataGenerator();
};

/**
 * Document Analyzer
 */
export const analyzeDocument = async (fileName, text) => {
  const truncated = text.substring(0, 15000);
  
  const systemInstructions = `Analyze the document and return JSON with: summaryText, keyPoints (5 items), flashcards (3 cards), highlights, recommendations, topics, keywords (word count format), sentiment (label/score/breakdown).`;

  const mockGenerator = () => {
    const words = truncated.toLowerCase().match(/\b[a-z]{5,15}\b/g) || [];
    const counts = {};
    words.forEach(w => {
      if (!['about', 'their', 'would', 'could', 'which'].includes(w)) {
        counts[w] = (counts[w] || 0) + 1;
      }
    });
    const keywordList = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));

    return {
      summaryText: `Document "${fileName}" provides comprehensive coverage of key concepts with structured insights. It presents important frameworks and delivers practical value across multiple domains. The content synthesizes complex ideas into actionable takeaways suitable for professional and educational contexts.`,
      keyPoints: [
        "Core concepts and frameworks outlined clearly",
        "Practical applications demonstrated throughout",
        "Key technical challenges identified and discussed",
        "Modern approaches to solving common issues",
        "Future trends and recommendations provided"
      ],
      flashcards: [
        { question: `What is the main topic of "${fileName}"?`, answer: "The document explores advanced frameworks and practical methodologies." },
        { question: "What are the key recommendations?", answer: "Adopt modern workflows and integrate advanced systems for optimal efficiency." },
        { question: "What challenges are discussed?", answer: "The document identifies barriers in implementation and proposes solutions." }
      ],
      highlights: [
        '"Integrating modern systems is essential for competitive advantage."',
        '"Traditional frameworks must be updated to accommodate new technologies."'
      ],
      recommendations: [
        "Create structured implementation plans",
        "Cross-reference with industry best practices",
        "Monitor and measure outcomes"
      ],
      topics: keywordList.map(k => k.word).map(w => w.charAt(0).toUpperCase() + w.slice(1)),
      keywords: keywordList.length ? keywordList : [{ word: 'content', count: 3 }],
      sentiment: {
        label: 'Neutral',
        score: 0.5,
        breakdown: { positive: 0.35, neutral: 0.45, negative: 0.2 }
      }
    };
  };

  return generateStructuredJSON(systemInstructions, truncated, mockGenerator);
};

/**
 * Image Analyzer
 */
export const analyzeImage = async (fileName, ocrText) => {
  const systemInstructions = `Analyze this image and OCR text. Return JSON with: caption (1 sentence), explanation (detailed), detectedObjects (list), topics, keywords (word count format), sentiment.`;

  const mockGenerator = () => ({
    caption: `Professional digital document containing structured text and visual elements`,
    explanation: `This image appears to be a document or digital content containing text and visual information. The OCR extraction has identified ${(ocrText || '').split(' ').length} distinct text elements arranged in a structured hierarchy with clear content blocks.`,
    detectedObjects: ["Text blocks", "Headers", "Content sections", "Visual elements"],
    topics: ["Document Analysis", "Visual Processing", "OCR Data"],
    keywords: ocrText ? 
      ocrText.toLowerCase().match(/\b[a-z]{4,15}\b/g)?.slice(0, 5).map(w => ({ word: w, count: 1 })) || [{ word: 'image', count: 1 }] 
      : [{ word: 'visual', count: 1 }],
    sentiment: {
      label: 'Neutral',
      score: 0.5,
      breakdown: { positive: 0.3, neutral: 0.6, negative: 0.1 }
    }
  });

  return generateStructuredJSON(systemInstructions, `File: ${fileName}\nOCR: ${(ocrText || '').substring(0, 5000)}`, mockGenerator);
};

/**
 * Context-Aware Chat
 */
export const chatWithContext = async (contextType, fileName, contextText, chatHistory, userMessage) => {
  const gemini = getGemini();
  const openai = getOpenAI();

  const formattedHistory = chatHistory
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');

  const systemInstructions = `You are DocuMind AI Assistant. Chat about "${fileName}" (${contextType}). Use the file content to answer. If not in file, use broad knowledge but clarify. Be professional and format in Markdown.

FILE CONTENT (first 10000 chars):
${(contextText || '').substring(0, 10000)}`;

  const prompt = `HISTORY:\n${formattedHistory}\n\nUSER: ${userMessage}\n\nASSISTANT:`;

  // Gemini
  if (gemini) {
    try {
      console.log('[Chat] Using Gemini');
      const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(`${systemInstructions}\n\n${prompt}`);
      return result.response.text();
    } catch (err) {
      console.error(`[Chat Error] Gemini: ${err.message}`);
    }
  }

  // OpenAI
  if (openai) {
    try {
      console.log('[Chat] Using OpenAI');
      const messages = [{ role: 'system', content: systemInstructions }];
      chatHistory.forEach(msg => {
        messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
      });
      messages.push({ role: 'user', content: userMessage });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error(`[Chat Error] OpenAI: ${err.message}`);
    }
  }

  // Mock
  console.log('[Chat] Using mock response');
  return `### Response from DocuMind Assistant 🤖

Regarding your question about **"${fileName}"** (${contextType}):

Your message was: *"${userMessage}"*

Based on the available context and the file type, here are my insights:

1. **Direct Answer**: I'm currently in mock/offline mode, so I'm providing a simulated response based on your inquiry pattern.
2. **Context Consideration**: The file "${fileName}" contains information relevant to your question.
3. **Recommendation**: For best results, ensure your AI API keys (Gemini or OpenAI) are configured in your environment.

For full AI-powered responses, please configure \`GEMINI_API_KEY\` or \`OPENAI_API_KEY\` in your environment variables.`;
};
