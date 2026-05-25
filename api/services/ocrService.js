import { createWorker } from 'tesseract.js';
import fetch from 'node-fetch';

/**
 * Performs OCR on an image URL (Cloudinary)
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {Promise<{text: string, words: Array}>}
 */
export const performOCR = async (imageUrl) => {
  let worker = null;
  try {
    console.log(`[OCR Service] Starting Tesseract OCR for ${imageUrl}...`);
    worker = await createWorker();
    
    // Tesseract can work with URLs directly
    const { data } = await worker.recognize(imageUrl);
    
    const text = data.text || '';
    const words = (data.words || []).map(w => ({
      text: w.text,
      confidence: w.confidence,
      bbox: {
        x0: w.bbox.x0,
        y0: w.bbox.y0,
        x1: w.bbox.x1,
        y1: w.bbox.y1
      }
    }));

    console.log(`[OCR Service] OCR Complete. Extracted ${words.length} words.`);
    return { text, words };
  } catch (error) {
    console.error(`[OCR Service Error] ${error.message}`);
    throw new Error(`OCR failed: ${error.message}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (err) {
        console.error('[OCR Service] Worker termination error:', err.message);
      }
    }
  }
};
