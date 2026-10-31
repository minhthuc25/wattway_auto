import express from 'express';
import vehicleRoutes from './routes/vehicles.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ev-inventory-api' });
});

app.use('/api/vehicles', vehicleRoutes);

// Consistent JSON response for unknown routes.
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Basic error handler.
app.use((err, _req, res, _next) => {
  // Client errors raised by Express itself (e.g. malformed JSON) are marked safe to show.
  if (err.expose && err.status < 500) return res.status(err.status).json({ error: err.message });
  // PostgreSQL data (22xxx) and constraint (23xxx) errors mean a value in the request was rejected, e.g. a number too large.
  if (/^2[23]/.test(err.code)) return res.status(400).json({ error: 'Invalid value in request' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`EV Inventory API listening on http://localhost:${PORT}`);
});
