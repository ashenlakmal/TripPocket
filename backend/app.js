import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import tripRoutes from './routes/tripRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' } });
});
app.use('/api', tripRoutes);
app.use('/api', expenseRoutes);
app.use('/api', summaryRoutes);
app.use((_req, res) => res.status(404).json({ error: { message: 'Route not found.' } }));
app.use((error, _req, res, _next) => {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
  res.status(status).json({ error: { message: status === 500 ? 'Something went wrong.' : error.message } });
});

export default app;
