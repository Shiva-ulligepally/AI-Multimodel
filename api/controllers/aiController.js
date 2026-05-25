import UploadedFile from '../models/UploadedFile.js';
import ChatHistory from '../models/ChatHistory.js';
import Transcript from '../models/Transcript.js';
import { chatWithContext } from '../services/llmService.js';
import { extractTextFromDocument } from '../services/documentParser.js';

/**
 * Sends a chat message, retrieves context, invokes AI, and appends to ChatHistory
 */
export const chatSession = async (req, res) => {
  try {
    const { fileId, message, sessionType = 'general' } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message content cannot be blank.' });
    }

    let fileName = 'General Workspace';
    let contextText = 'You are a general system assistant.';
    let fileRecord = null;

    // Fetch file context if a fileId is provided
    if (fileId) {
      fileRecord = await UploadedFile.findById(fileId);
      if (!fileRecord) {
        return res.status(404).json({ error: 'Associated file record not found.' });
      }

      fileName = fileRecord.originalName;

      if (fileRecord.category === 'document') {
        try {
          contextText = await extractTextFromDocument(fileRecord.cloudinaryUrl, fileRecord.mimeType);
        } catch (err) {
          console.error('[AI Chat Controller Error] Context extract failed:', err.message);
          contextText = `Document title is: ${fileName}. Text parsing error: ${err.message}`;
        }
      } else {
        const transcriptRecord = await Transcript.findOne({ fileId });
        if (transcriptRecord) {
          contextText = transcriptRecord.rawText;
        } else {
          contextText = `Asset named: ${fileName}. Transcript is empty.`;
        }
      }
    }

    // Fetch or initialize ChatHistory
    const query = fileId ? { fileId } : { fileId: null, sessionType: 'general' };
    let chatRecord = await ChatHistory.findOne(query);

    if (!chatRecord) {
      chatRecord = await ChatHistory.create({
        fileId: fileId || null,
        sessionType: fileId ? fileRecord.category : 'general',
        messages: []
      });
    }

    // Extract chat history (limit to last 15 messages for token economy)
    const historyArray = chatRecord.messages.slice(-15).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Invoke contextual chat service
    console.log(`[AI Chat] Querying assistant context for file: ${fileName}...`);
    const assistantReply = await chatWithContext(
      fileId ? fileRecord.category : 'general',
      fileName,
      contextText,
      historyArray,
      message
    );

    // Append messages to history
    chatRecord.messages.push({ role: 'user', content: message });
    chatRecord.messages.push({ role: 'assistant', content: assistantReply });
    await chatRecord.save();

    res.status(200).json({
      reply: assistantReply,
      history: chatRecord
    });

  } catch (error) {
    console.error('[AI Chat Controller Error]', error.message);
    res.status(500).json({ error: `AI Assistant Chat failed: ${error.message}` });
  }
};

/**
 * Retrieve chat message history log for a specific file context
 */
export const getChatHistory = async (req, res) => {
  try {
    const { fileId } = req.query;
    const query = fileId ? { fileId } : { fileId: null, sessionType: 'general' };
    
    let chatRecord = await ChatHistory.findOne(query);
    if (!chatRecord) {
      return res.status(200).json({ messages: [] });
    }

    res.status(200).json(chatRecord);
  } catch (error) {
    console.error('[AI Chat Controller Error]', error.message);
    res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
};

/**
 * Regenerate or fetch Flashcards study set
 */
export const generateFlashcards = async (req, res) => {
  try {
    const { fileId } = req.params;
    const summary = await Summary.findOne({ fileId });
    
    if (!summary) {
      return res.status(404).json({ error: 'No analyzed summary found for this file.' });
    }

    // If flashcards exist, return them
    if (summary.flashcards && summary.flashcards.length > 0) {
      return res.status(200).json(summary.flashcards);
    }

    // Generate default flashcards
    summary.flashcards = [
      { question: "What is the key takeaway?", answer: (summary.summaryText || '').substring(0, 150) + "..." },
      { question: "What are the core topics?", answer: (summary.keyPoints || []).join(', ') || 'General studies' }
    ];
    await summary.save();

    res.status(200).json(summary.flashcards);
  } catch (error) {
    console.error('[AI Chat Controller Error]', error.message);
    res.status(500).json({ error: 'Failed to construct flashcards.' });
  }
};
