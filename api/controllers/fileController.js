import UploadedFile from '../models/UploadedFile.js';
import Transcript from '../models/Transcript.js';
import Summary from '../models/Summary.js';
import Analytics from '../models/Analytics.js';
import { extractTextFromDocument } from '../services/documentParser.js';
import { performOCR } from '../services/ocrService.js';
import { analyzeDocument, analyzeImage } from '../services/llmService.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

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
          summaryText: analysisResult.summaryText,
          keyPoints: analysisResult.keyPoints,
          flashcards: analysisResult.flashcards,
          highlights: analysisResult.highlights,
          recommendations: analysisResult.recommendations
        });

        await Transcript.create({
          fileId: fileRecord._id,
          sessionType: 'upload',
          rawText: extractedText,
          segments: [{ start: 0, end: 5, speaker: 'Document Text', text: extractedText.substring(0, 500) }]
        });

      } else if (category === 'image') {
        const ocrData = await performOCR(cloudinaryResult.secure_url);
        extractedText = ocrData.text;
        ocrWords = ocrData.words;

        analysisResult = await analyzeImage(originalname, extractedText);

        await Transcript.create({
          fileId: fileRecord._id,
          sessionType: 'upload',
          rawText: extractedText,
          segments: [{ start: 0, end: 5, speaker: 'OCR Text', text: extractedText.substring(0, 500) }]
        });

        await Summary.create({
          fileId: fileRecord._id,
          summaryText: analysisResult.explanation || 'Image analyzed via OCR',
          keyPoints: [analysisResult.caption || 'Image Caption'],
          highlights: ocrWords.map(w => w.text).slice(0, 10),
          recommendations: analysisResult.detectedObjects || []
        });
      }

      // Save Analytics
      const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
      await Analytics.create({
        fileId: fileRecord._id,
        topics: analysisResult.topics || [],
        keywords: analysisResult.keywords || [],
        sentiment: analysisResult.sentiment || {
          label: 'Neutral',
          score: 0.5,
          breakdown: { positive: 0.33, neutral: 0.34, negative: 0.33 }
        },
        wordCount,
        extraStats: {
          ocrWordsCount: ocrWords.length,
          cloudinaryUrl: cloudinaryResult.secure_url
        }
      });

      // Update file to completed
      fileRecord.processedState = 'completed';
      await fileRecord.save();

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
      
      fileRecord.processedState = 'failed';
      fileRecord.error = processError.message;
      await fileRecord.save();

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
