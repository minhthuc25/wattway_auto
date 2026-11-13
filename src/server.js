import express from 'express';
import vehicleRoutes from './routes/vehicles.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import loanRoutes from './routes/loan.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import testDriveRoutes from './routes/testDrives.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ev-inventory-api' });
});

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/test-drives', testDriveRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  if (err.expose && err.status < 500) return res.status(err.status).json({ error: err.message }); // e.g. malformed JSON
  if (/^2[23]/.test(err.code)) return res.status(400).json({ error: 'Invalid value in request' }); // postgres data/constraint errors
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`EV Inventory API listening on http://localhost:${PORT}`);
});
