import UploadedFile from '../models/UploadedFile.js';
import Transcript from '../models/Transcript.js';
import Summary from '../models/Summary.js';
import Analytics from '../models/Analytics.js';
import { extractTextFromDocument } from '../services/documentParser.js';
import { performOCR } from '../services/ocrService.js';
import { analyzeDocument, analyzeImage } from '../services/llmService.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// Robust sanitizers for LLM outputs to fit Mongoose Schemas
const sanitizeSentiment = (sentiment) => {
  const defaultSentiment = {
    label: 'Neutral',
    score: 0.5,
    breakdown: { positive: 0.33, neutral: 0.34, negative: 0.33 }
  };

  if (!sentiment) return defaultSentiment;

  // If sentiment is a string (e.g., "Neutral")
  if (typeof sentiment === 'string') {
    let label = 'Neutral';
    const low = sentiment.toLowerCase();
    if (low.includes('pos')) label = 'Positive';
    else if (low.includes('neg')) label = 'Negative';
    
    return {
      label,
      score: label === 'Positive' ? 0.8 : label === 'Negative' ? 0.2 : 0.5,
      breakdown: {
        positive: label === 'Positive' ? 0.7 : label === 'Negative' ? 0.1 : 0.33,
        neutral: label === 'Neutral' ? 0.7 : 0.2,
        negative: label === 'Negative' ? 0.7 : label === 'Positive' ? 0.1 : 0.33
      }
    };
  }

  // If sentiment is an object
  if (typeof sentiment === 'object' && sentiment !== null) {
    let label = 'Neutral';
    if (sentiment.label) {
      const low = String(sentiment.label).toLowerCase();
      if (low.includes('pos')) label = 'Positive';
      else if (low.includes('neg')) label = 'Negative';
    }

    let score = typeof sentiment.score === 'number' ? sentiment.score : 0.5;
    if (score < 0 || score > 1) score = 0.5;

    const breakdown = {
      positive: 0.33,
      neutral: 0.34,
      negative: 0.33
    };

    if (sentiment.breakdown && typeof sentiment.breakdown === 'object') {
      breakdown.positive = typeof sentiment.breakdown.positive === 'number' ? sentiment.breakdown.positive : 0.33;
      breakdown.neutral = typeof sentiment.breakdown.neutral === 'number' ? sentiment.breakdown.neutral : 0.34;
      breakdown.negative = typeof sentiment.breakdown.negative === 'number' ? sentiment.breakdown.negative : 0.33;
    } else {
      // Check flattened fields
      breakdown.positive = typeof sentiment.positive === 'number' ? sentiment.positive : 0.33;
      breakdown.neutral = typeof sentiment.neutral === 'number' ? sentiment.neutral : 0.34;
      breakdown.negative = typeof sentiment.negative === 'number' ? sentiment.negative : 0.33;
    }

    return { label, score, breakdown };
  }

  return defaultSentiment;
};

const sanitizeKeywords = (keywords) => {
  if (!keywords) return [];

  // If it's an object of word -> count
  if (typeof keywords === 'object' && !Array.isArray(keywords) && keywords !== null) {
    return Object.entries(keywords).map(([word, val]) => ({
      word: String(word),
      count: typeof val === 'number' ? val : 1
    }));
  }

  if (Array.isArray(keywords)) {
    return keywords.map((item, idx) => {
      if (typeof item === 'string') {
        return { word: item, count: 1 };
      }
      if (typeof item === 'object' && item !== null) {
        const word = item.word || item.keyword || item.key || item.text || `key_${idx}`;
        const countVal = item.count !== undefined ? item.count : (item.frequency || item.freq || item.score || 1);
        const count = typeof countVal === 'number' ? countVal : parseInt(countVal, 10) || 1;
        return { word: String(word), count };
      }
      return null;
    }).filter(Boolean);
  }

  return [];
};

const sanitizeTopics = (topics) => {
  if (!topics) return [];
  if (typeof topics === 'string') {
    return topics.split(',').map(t => t.trim()).filter(Boolean);
  }
  if (Array.isArray(topics)) {
    return topics.map(t => String(t).trim()).filter(Boolean);
  }
  return [];
};

const sanitizeFlashcards = (flashcards) => {
  if (!flashcards) return [];
  if (Array.isArray(flashcards)) {
    return flashcards.map((card, idx) => {
      if (typeof card === 'object' && card !== null) {
        const question = card.question || card.q || card.front || `Question ${idx + 1}`;
        const answer = card.answer || card.a || card.back || `Answer ${idx + 1}`;
        return { question: String(question), answer: String(answer) };
      }
      if (typeof card === 'string') {
        return { question: card, answer: `Information about ${card}` };
      }
      return null;
    }).filter(Boolean);
  }
  return [];
};

/**
 * Handle file uploads, sync to Cloudinary, and run AI Analysis
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file rejected by Multer filters.' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const ext = originalname.split('.').pop().toLowerCase();

    let category = 'document';
    if (['png', 'jpg', 'jpeg'].includes(ext) || mimetype.startsWith('image/')) {
      category = 'image';
    }

    console.log(`[File Controller] Ingesting file: ${originalname} (${category}) size: ${size} bytes`);

    // Upload to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(buffer, `${Date.now()}-${originalname}`);
    } catch (err) {
      console.error('[Cloudinary Upload Error]', err.message);
      return res.status(500).json({ error: `Failed to upload file to cloud storage: ${err.message}` });
    }

    // Create DB entry in 'processing' status
    const fileRecord = await UploadedFile.create({
      filename: cloudinaryResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      size,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      category,
      processedState: 'processing'
    });

    let extractedText = '';
    let analysisResult = null;
    let ocrWords = [];

    try {
      // 3. Execution Pipeline by Category
      if (category === 'document') {
        // For documents, download or use cloudinary URL
        extractedText = await extractTextFromDocument(cloudinaryResult.secure_url, mimetype);
        analysisResult = await analyzeDocument(originalname, extractedText);
        
        await Summary.create({
          fileId: fileRecord._id,
          summaryText: analysisResult.summaryText || 'Document summary ready.',
          keyPoints: sanitizeTopics(analysisResult.keyPoints),
          flashcards: sanitizeFlashcards(analysisResult.flashcards),
          highlights: sanitizeTopics(analysisResult.highlights),
          recommendations: sanitizeTopics(analysisResult.recommendations)
        });

        await Transcript.create({
          fileId: fileRecord._id,
          sessionType: 'upload',
          rawText: extractedText || ' ',
          segments: [{ start: 0, end: 5, speaker: 'Document Text', text: extractedText.substring(0, 500) || ' ' }]
        });

      } else if (category === 'image') {
        const ocrData = await performOCR(cloudinaryResult.secure_url);
        extractedText = ocrData.text;
        ocrWords = ocrData.words;

        analysisResult = await analyzeImage(originalname, extractedText);

        await Transcript.create({
          fileId: fileRecord._id,
          sessionType: 'upload',
          rawText: extractedText || ' ',
          segments: [{ start: 0, end: 5, speaker: 'OCR Text', text: extractedText.substring(0, 500) || ' ' }]
        });

        await Summary.create({
          fileId: fileRecord._id,
          summaryText: analysisResult.explanation || 'Image analyzed via OCR',
          keyPoints: sanitizeTopics([analysisResult.caption || 'Image Caption']),
          highlights: ocrWords.map(w => w.text).slice(0, 10),
          recommendations: sanitizeTopics(analysisResult.detectedObjects || [])
        });
      }

      // Save Analytics
      const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
      await Analytics.create({
        fileId: fileRecord._id,
        topics: sanitizeTopics(analysisResult.topics),
        keywords: sanitizeKeywords(analysisResult.keywords),
        sentiment: sanitizeSentiment(analysisResult.sentiment),
        wordCount,
        extraStats: {
          ocrWordsCount: ocrWords.length,
          cloudinaryUrl: cloudinaryResult.secure_url
        }
      });

      // Update file to completed (check if it was deleted mid-flight by user)
      const fileExists = await UploadedFile.findById(fileRecord._id);
      if (fileExists) {
        fileRecord.processedState = 'completed';
        await fileRecord.save();
      } else {
        console.warn(`[File Controller] File record ${fileRecord._id} was deleted during processing.`);
        return res.status(404).json({ error: 'File was deleted during processing.' });
      }

      console.log(`[File Controller] Ingestion & AI analysis completed for: ${originalname}`);

      return res.status(200).json({
        message: 'File uploaded and analyzed successfully.',
        file: fileRecord,
        data: {
          extractedText: extractedText.substring(0, 1000),
          ocrWords,
          summary: analysisResult
        }
      });

    } catch (processError) {
      console.error(`[File Controller Error] Ingestion failed for ${originalname}:`, processError.message);
      
      try {
        const fileExists = await UploadedFile.findById(fileRecord._id);
        if (fileExists) {
          fileRecord.processedState = 'failed';
          fileRecord.error = processError.message;
          await fileRecord.save();
        }
      } catch (saveErr) {
        console.error('[File Controller Error] Failed to update fail state:', saveErr.message);
      }

      return res.status(500).json({
        error: `File parsing failed during AI analysis: ${processError.message}`,
        file: fileRecord
      });
    }

  } catch (error) {
    console.error('[File Controller Error] Fatal upload crash:', error.message);
    res.status(500).json({ error: `Fatal server upload error: ${error.message}` });
  }
};

/**
 * Fetch list of all uploaded files
 */
export const getAllFiles = async (req, res) => {
  try {
    const files = await UploadedFile.find().sort({ createdAt: -1 });
    res.status(200).json(files);
  } catch (error) {
    console.error('[File Controller Error] Fetch all failed:', error.message);
    res.status(500).json({ error: 'Failed to retrieve uploaded files list.' });
  }
};

/**
 * Fetch detail records for a specific file
 */
export const getFileDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await UploadedFile.findById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const transcript = await Transcript.findOne({ fileId: id });
    const summary = await Summary.findOne({ fileId: id });
    const analytics = await Analytics.findOne({ fileId: id });

    res.status(200).json({
      file,
      transcript,
      summary,
      analytics
    });
  } catch (error) {
    console.error('[File Controller Error] Fetch details failed:', error.message);
    res.status(500).json({ error: 'Failed to retrieve file details.' });
  }
};

/**
 * Delete file and Cloudinary assets
 */
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await UploadedFile.findById(id);

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Delete from Cloudinary
    if (file.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(file.cloudinaryPublicId);
        console.log(`[Cloudinary] Deleted: ${file.cloudinaryPublicId}`);
      } catch (err) {
        console.error('[Cloudinary Delete Error]', err.message);
      }
    }

    // Delete DB records
    await UploadedFile.findByIdAndDelete(id);
    await Transcript.deleteMany({ fileId: id });
    await Summary.deleteMany({ fileId: id });
    await Analytics.deleteMany({ fileId: id });

    res.status(200).json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('[File Controller Error] Delete failed:', error.message);
    res.status(500).json({ error: 'Failed to delete file.' });
  }
};
