import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import { parseId } from '../middleware/parseId.js';
import { checkoutCart } from '../services/orderService.js';
import { listOrders, getOrder } from '../storage/orderStore.js';
import { validateCheckout } from '../validation/validators.js';

const router = Router();

router.use(requireLogin);
router.param('id', parseId);

router.post('/', async (req, res) => {
  const result = validateCheckout(req.body);
  if (result) return res.status(400).json({ error: result });

  const { problem, vehicleId, available, order } = await checkoutCart(req.user.id, req.body.shipping, req.body.card);
  if (problem === 'empty_cart') return res.status(409).json({ error: 'Cart is empty' });
  if (problem === 'insufficient_stock') return res.status(409).json({ error: 'Cart quantity exceeds available stock', vehicleId, available });
  if (order.status === 'DENIED') return res.status(402).json({ error: 'Credit Card Authorization Failed' });
  res.status(201).json({ message: 'Order Successfully Completed', data: order });
});

router.get('/', async (req, res) => {
  const orders = await listOrders(req.user.id);
  res.json({ data: orders, count: orders.length });
});

router.get('/:id', async (req, res) => {
  const order = await getOrder(req.user.id, req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ data: order });
});

export default router;
