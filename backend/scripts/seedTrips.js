import mongoose from 'mongoose';
import Trip from '../models/Trip.js';

const sampleTrips = [
  {
    name: 'Kandy Weekend',
    destination: 'Kandy, Sri Lanka',
    startDate: new Date('2026-12-05T00:00:00.000Z'),
    endDate: new Date('2026-12-08T00:00:00.000Z'),
    budget: 45000,
  },
  {
    name: 'Galle Coast Trip',
    destination: 'Galle, Sri Lanka',
    startDate: new Date('2026-12-19T00:00:00.000Z'),
    endDate: new Date('2026-12-23T00:00:00.000Z'),
    budget: 75000,
  },
  {
    name: 'Ella Adventure',
    destination: 'Ella, Sri Lanka',
    startDate: new Date('2027-01-10T00:00:00.000Z'),
    endDate: new Date('2027-01-14T00:00:00.000Z'),
    budget: 60000,
  },
];

async function seedTrips() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trippocket';
  await mongoose.connect(uri);

  let inserted = 0;
  let updated = 0;

  for (const trip of sampleTrips) {
    const result = await Trip.updateOne(
      { name: trip.name },
      { $set: trip },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    if (result.upsertedCount) inserted += 1;
    else updated += 1;
  }

  console.log(`Seeded ${inserted} new trip(s) and refreshed ${updated} existing trip(s).`);
}

try {
  await seedTrips();
} catch (error) {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
