import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileBuffer, fileName) => {
  // If Cloudinary credentials are not set, fall back to local storage
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log(`[Cloudinary Config] ⚠️ Cloudinary credentials missing. Falling back to local storage.`);
    
    // Ensure the api/uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Clean fileName to be safe for filenames
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = path.join(uploadsDir, safeFileName);
    
    // Write buffer to file
    fs.writeFileSync(filePath, fileBuffer);
    
    const port = process.env.PORT || 5000;
    // We return a mock Cloudinary response
    return {
      public_id: safeFileName,
      secure_url: `http://localhost:${port}/uploads/${safeFileName}`
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: fileName,
        folder: 'documind-uploads',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log(`[Cloudinary Config] ⚠️ Local storage delete: ${publicId}`);
    try {
      const filePath = path.join(__dirname, '..', 'uploads', publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { result: 'ok' };
    } catch (err) {
      console.error('[Local Storage Delete Error]', err.message);
      return { result: 'failed' };
    }
  }

  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error('[Cloudinary Error]', err.message);
    throw err;
  }
};

export default cloudinary;
