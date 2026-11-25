import { Router } from 'express';
import { getSummary, getCategorySummary } from '../controllers/summaryController.js';

const router = Router();

router.get('/trips/:tripId/summary', getSummary);
router.get('/trips/:tripId/category-summary', getCategorySummary);

export default router;
