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
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`EV Inventory API listening on http://localhost:${PORT}`);
});
