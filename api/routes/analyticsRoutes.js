import express from 'express';
import { getPlatformAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// Fetch compiled dashboard analytics metrics
router.get('/', getPlatformAnalytics);

export default router;
