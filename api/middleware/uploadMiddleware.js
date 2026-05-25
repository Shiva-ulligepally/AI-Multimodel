import multer from 'multer';
import path from 'path';

// Use memory storage for Vercel (Cloudinary will handle file storage)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    // Documents
    '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt',
    // Images
    '.png', '.jpg', '.jpeg',
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not supported. Please upload PDF, DOCX, PPT, TXT, PNG, or JPG files.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB max
  },
});

export default upload;
