import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getSalesReport } from '../storage/orderStore.js';
import { getUsageReport } from '../storage/visitEventStore.js';
import { validateSalesReport } from '../validation/validators.js';

const router = Router();

router.use(requireAdmin);

router.get('/sales', async (req, res) => {
  const result = validateSalesReport(req.query);
  if (result) return res.status(400).json({ error: result });

  const sales = await getSalesReport(Number(req.query.year));
  res.json({ data: sales, count: sales.length });
});

router.get('/usage', async (_req, res) => {
  const usage = await getUsageReport();
  res.json({ data: usage, count: usage.length });
});

export default router;
