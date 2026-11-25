// Abdul Rahman: implement these functions and connect them to the database.

import Trip from '../models/Trip.js';

export async function getTrips(_req, res) {
  const trips = await Trip.find().sort({ createdAt: -1 }).lean();
  res.json({ data: trips });
}

export async function createTrip(req, res) {
  // TODO: Implement POST /trips.
  res.status(501).json({ error: { message: "Not implemented yet." } });
}

export async function getTrip(req, res) {
  // TODO: Implement GET /trips/:id.
  res.status(501).json({ error: { message: "Not implemented yet." } });
}

export async function updateTrip(req, res) {
  // TODO: Implement PUT /trips/:id.
  res.status(501).json({ error: { message: "Not implemented yet." } });
}

export async function deleteTrip(req, res) {
  // TODO: Implement DELETE /trips/:id.
  res.status(501).json({ error: { message: "Not implemented yet." } });
}
