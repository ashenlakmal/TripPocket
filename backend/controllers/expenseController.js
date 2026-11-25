import mongoose from 'mongoose';
import Expense from '../models/Expense.js';

const CATEGORIES = new Set(['Food', 'Transport', 'Accommodation', 'Activities', 'Other']);

function fail(message, status) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);
}

function validateId(value, label) {
  if (!isValidObjectId(value)) fail(`Invalid ${label}.`, 400);
}

async function assertTripExists(tripId) {
  validateId(tripId, 'trip id');
  if (!mongoose.connection.db) throw new Error('Database is not connected.');
  const trip = await mongoose.connection.db
    .collection('trips')
    .findOne({ _id: new mongoose.Types.ObjectId(tripId) }, { projection: { _id: 1 } });
  if (!trip) fail('Trip not found.', 404);
}

function normalizeExpenseInput(body = {}) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) fail('Expense title is required.', 400);
  if (title.length > 120) fail('Expense title cannot exceed 120 characters.', 400);

  if (!CATEGORIES.has(body.category)) fail('Choose a valid category.', 400);

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) fail('Amount must be greater than zero.', 400);

  const date = new Date(body.date);
  if (Number.isNaN(date.getTime())) fail('Expense date is invalid.', 400);

  return {
    title,
    category: body.category,
    amount: Math.round(amount * 100) / 100,
    date,
  };
}

function handle(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error.name === 'ValidationError' || error.name === 'CastError') error.status = 400;
      next(error);
    }
  };
}

export const getExpenses = handle(async (req, res) => {
  const { tripId } = req.params;
  validateId(tripId, 'trip id');
  const expenses = await Expense.find({ tripId }).sort({ date: -1, createdAt: -1 }).lean();
  res.json({ data: expenses });
});

export const createExpense = handle(async (req, res) => {
  const { tripId } = req.params;
  await assertTripExists(tripId);
  const expense = await Expense.create({ ...normalizeExpenseInput(req.body), tripId });
  res.status(201).json({ data: expense });
});

export const updateExpense = handle(async (req, res) => {
  const { id } = req.params;
  validateId(id, 'expense id');
  const expense = await Expense.findByIdAndUpdate(
    id,
    { $set: normalizeExpenseInput(req.body) },
    { new: true, runValidators: true },
  ).lean();
  if (!expense) fail('Expense not found.', 404);
  res.json({ data: expense });
});

export const deleteExpense = handle(async (req, res) => {
  const { id } = req.params;
  validateId(id, 'expense id');
  const expense = await Expense.findByIdAndDelete(id).lean();
  if (!expense) fail('Expense not found.', 404);
  res.status(204).send();
});
