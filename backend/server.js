import app from './app.js';
import { connectDatabase } from './config/db.js';

try {
  await connectDatabase();
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => console.log(`TripPocket API listening on port ${port}`));
  server.on('error', error => { console.error(error.message); process.exit(1); });
} catch (error) {
  console.error(`Server could not start: ${error.message}`);
  process.exit(1);
}
