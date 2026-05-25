import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';
import officeParser from 'officeparser';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Extracts raw text from a document URL (Cloudinary) based on its MIME type
 * @param {string} urlOrPath - URL or local path to file
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<string>} Extracted text content
 */
export const extractTextFromDocument = async (urlOrPath, mimeType) => {
  try {
    let buffer;

    // Fetch from URL if it's a Cloudinary URL
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      console.log(`[Document Parser] Fetching document from ${urlOrPath}...`);
      const response = await fetch(urlOrPath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      buffer = await response.buffer();
    } else {
      // Local temp file path!
      const fileName = path.basename(urlOrPath);
      const localPath = path.join(os.tmpdir(), fileName);
      console.log(`[Document Parser] Reading local file directly from temp: ${localPath}`);
      if (!fs.existsSync(localPath)) throw new Error(`File not found in temp directory: ${fileName}`);
      buffer = fs.readFileSync(localPath);
    }

    // Determine file type and extract
    const ext = (urlOrPath.split('.').pop() || '').toLowerCase().replace(/[?#].*/, '');

    // Text files
    if (ext === 'txt' || mimeType === 'text/plain') {
      const content = buffer.toString('utf-8');
      return content || 'Empty text file.';
    }

    // PDF files
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text || 'No text found in PDF.';
    }

    // Office documents (DOCX, PPTX)
    if (['docx', 'doc', 'pptx', 'ppt'].includes(ext) ||
        mimeType.includes('officedocument') || mimeType.includes('msword') || mimeType.includes('powerpoint')) {
      // For office files, write to temp and parse, then clean up
      const tempFile = path.join(os.tmpdir(), `doc_${Date.now()}.${ext}`);
      fs.writeFileSync(tempFile, buffer);
      const extractedText = await officeParser.parseOfficeAsync(tempFile);
      fs.unlinkSync(tempFile);
      return extractedText || 'No text found in Office document.';
    }

    // Fallback
    const text = buffer.toString('utf-8').replace(/[^\x20-\x7E\t\r\n]/g, '');
    if (text.trim().length > 100) return text.substring(0, 10000);
    
    throw new Error(`Unsupported file type: ${ext}`);
  } catch (error) {
    console.error(`[Document Parser Error] ${error.message}`);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};
