import { createWorker } from 'tesseract.js';
import fetch from 'node-fetch';
import os from 'os';
import path from 'path';

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
    
    let ocrTarget = imageUrl;
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      const fileName = path.basename(imageUrl);
      ocrTarget = path.join(os.tmpdir(), fileName);
      console.log(`[OCR Service] Reading local file directly from temp: ${ocrTarget}`);
    }

    // Tesseract can work with URLs directly
    const { data } = await worker.recognize(ocrTarget);
    
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
