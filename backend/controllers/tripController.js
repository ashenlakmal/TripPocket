import mongoose from 'mongoose';
import Trip from '../models/Trip.js';

const EDITABLE_FIELDS = ['name', 'destination', 'startDate', 'endDate', 'budget'];

function pickTripFields(body = {}) {
  const fields = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  return fields;
}

function sendError(res, status, message, details) {
  res.status(status).json({ error: { message, ...(details && { details }) } });
}

// Turns a Mongoose validation error into { message, details: { field: message } }.
function sendValidationError(res, error) {
  const details = {};
  for (const [field, fieldError] of Object.entries(error.errors)) {
    details[field] =
      fieldError.name === 'CastError'
        ? field === 'budget'
          ? 'Budget must be a number.'
          : 'Enter a valid date.'
        : fieldError.message;
  }
  sendError(res, 400, Object.values(details)[0], details);
}

// Returns the trip, or sends a 400/404 response and returns null.
async function findTripOr404(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    sendError(res, 400, 'Invalid trip id.');
    return null;
  }
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    sendError(res, 404, 'Trip not found.');
    return null;
  }
  return trip;
}

export async function getTrips(_req, res, next) {
  try {
    const trips = await Trip.find().sort({ startDate: 1, createdAt: -1 });
    res.json({ data: trips });
  } catch (error) {
    next(error);
  }
}

export async function createTrip(req, res, next) {
  try {
    const trip = await Trip.create(pickTripFields(req.body));
    res.status(201).json({ data: trip });
  } catch (error) {
    if (error.name === 'ValidationError') return sendValidationError(res, error);
    next(error);
  }
}

export async function getTrip(req, res, next) {
  try {
    const trip = await findTripOr404(req, res);
    if (trip) res.json({ data: trip });
  } catch (error) {
    next(error);
  }
}

export async function updateTrip(req, res, next) {
  try {
    const trip = await findTripOr404(req, res);
    if (!trip) return;
    trip.set(pickTripFields(req.body));
    await trip.save();
    res.json({ data: trip });
  } catch (error) {
    if (error.name === 'ValidationError') return sendValidationError(res, error);
    next(error);
  }
}

export async function deleteTrip(req, res, next) {
  try {
    const trip = await findTripOr404(req, res);
    if (!trip) return;

    // Reads the expenses collection directly so this controller does not depend on the Expense model file.
    const expenseCount = await mongoose.connection.collection('expenses').countDocuments({ tripId: trip._id });
    if (expenseCount > 0) {
      return sendError(res, 409, 'This trip still has expenses. Delete its expenses before deleting the trip.');
    }

    await trip.deleteOne();
    res.json({ data: { id: trip.id } });
  } catch (error) {
    next(error);
  }
}
