import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { uploadFile, getAllFiles, getFileDetails, deleteFile } from '../controllers/fileController.js';

const router = express.Router();

// 1. Upload a single file (Document or Image) and run AI Analysis
router.post('/upload', upload.single('file'), uploadFile);

// 2. Fetch list of all uploaded files (metadata)
router.get('/', getAllFiles);

// 3. Fetch detailed file info (transcripts, summaries, analytics)
router.get('/:id', getFileDetails);

// 4. Delete file record and Cloudinary assets
router.delete('/:id', deleteFile);

export default router;
