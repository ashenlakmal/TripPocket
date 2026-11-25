// Ravindu Thiranjaya: implement these functions and connect them to the database.
import mongoose from 'mongoose'
import Trip from '../models/Trip.js'
import Expense from '../models/Expense.js'

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error; 
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

async function findTripOrThrow(tripId) {
  if (!mongoose.isValidObjectId(tripId)) {
    throw createHttpError(400, 'Trip id is not valid.')
  }

  const trip = await Trip.findById(tripId).select('budget');
  if (!trip) {
    throw createHttpError(404, 'Trip not found.');
  }
}

async function calculateTotalSpent(tripId) {
  const [result] = await Expense.aggregate([
    { $match: { tripId } },
    { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
  ]);

  return roundMoney(result?.totalSpent ?? 0);
}

async function calculateCategoryTotals(tripId) {
  const categoryTotals = await Expense.aggregate([
    { $match: { tripId } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1, _id: 1 } },
    { $project:  { _id: 0, category: '$_id', total: 1 } },
  ]);

  return categoryTotals.map(({ category, total }) => ({
    category,
    total: roundMoney(total),
  }));
}

// GET /trips/:tripId/summary.
export async function getSummary(req, res, next) {
  try {
    const trip = await findTripOrThrow(req.params.tripId);
    const totalSpent = await calculateTotalSpent(trip._id);

    res.json({
      data: {
        budget: trip.budget,
        totalSpent,
        remaining: roundMoney(trip.budget - totalSpent),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /trips/:tripId/category-summary.
export async function getCategorySummary(req, res, next) {
  try {
    const trip = await findTripOrThrow(req.params.tripId);
    const categories = await calculateCategoryTotals(trip._id);

    res.json({ data: { categories } });
  } catch (error) {
    next(error);
  }
}
