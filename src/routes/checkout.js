import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import { checkoutCart } from '../services/checkoutService.js';

const router = Router();

router.post('/', requireLogin, async (req, res, next) => {
  try {
    const result = await checkoutCart(req.user.id);
    if (result.status === 'empty_cart') return res.status(409).json({ error: 'Cart is empty' });
    if (result.status === 'insufficient_stock') {
      return res.status(409).json({
        error: 'Cart quantity exceeds available stock',
        vehicleId: result.vehicleId,
        available: result.available,
      });
    }
    res.status(201).json({ data: result.order });
  } catch (err) {
    next(err);
  }
});

export default router;
