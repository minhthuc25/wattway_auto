import express from 'express';
import vehicleRoutes from './routes/vehicles.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import loanRoutes from './routes/loan.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import testDriveRoutes from './routes/testDrives.js';
import analyticsRoutes from './routes/analytics.js';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3000; // Env variable PORT used when deploying to Render

app.set('trust proxy', true); // req.ip is the visitor's address, not Render's or Vercel's proxy
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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

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
