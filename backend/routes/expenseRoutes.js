import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController.js';

const router = Router();

router.get('/trips/:tripId/expenses', getExpenses);
router.post('/trips/:tripId/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

export default router;
