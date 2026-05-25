import express from 'express';
import { chatSession, getChatHistory, generateFlashcards } from '../controllers/aiController.js';

const router = express.Router();

// 1. Send chat message to contextual file parser or general assistant
router.post('/chat', chatSession);

// 2. Query chat history logs
router.get('/chat/history', getChatHistory);

// 3. Generate flashcard reviews based on document analysis
router.get('/flashcards/:fileId', generateFlashcards);

export default router;
