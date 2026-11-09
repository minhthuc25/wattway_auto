import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import { parseId } from '../middleware/parseId.js';
import { checkoutCart } from '../services/orderService.js';
import { listOrders, getOrder } from '../storage/orderStore.js';
import { validateCheckout } from '../validation/validators.js';

const router = Router();

// Every order route requires a login.
router.use(requireLogin);

router.param('id', parseId);

// Check out: places an order for everything in the user's cart.
router.post('/', async (req, res, next) => {
  try {
    const result = validateCheckout(req.body);
    if (result) return res.status(400).json({ error: result });

    const { problem, vehicleId, available, order } = await checkoutCart(req.user.id, req.body.shipping, req.body.card);
    if (problem === 'empty_cart') return res.status(409).json({ error: 'Cart is empty' });
    if (problem === 'insufficient_stock') return res.status(409).json({ error: 'Cart quantity exceeds available stock', vehicleId, available });
    if (order.status === 'DENIED') return res.status(402).json({ error: 'Credit Card Authorization Failed' });
    res.status(201).json({ message: 'Order Successfully Completed', data: order });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const orders = await listOrders(req.user.id);
    res.json({ data: orders, count: orders.length });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrder(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

export default router;
