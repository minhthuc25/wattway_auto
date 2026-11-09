import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import { parseId } from '../middleware/parseId.js';
import { getCart, addCartItem, changeCartItemQuantity } from '../services/cartService.js';
import { deleteCartItem, deleteCartItems } from '../storage/cartStore.js';
import { validateCartItem } from '../validation/validators.js';

const router = Router();

// Every cart route requires a login.
router.use(requireLogin);

router.param('vehicleId', parseId);

router.get('/', async (req, res, next) => {
  try {
    res.json({ data: await getCart(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.post('/items', async (req, res, next) => {
  try {
    const result = validateCartItem(req.body, true);
    if (result) return res.status(400).json({ error: result });

    const { vehicleId, quantity = 1 } = req.body;
    const problem = await addCartItem(req.user.id, vehicleId, quantity);
    if (problem === 'vehicle_not_found') return res.status(404).json({ error: 'Vehicle not found' });
    if (problem === 'insufficient_stock') return res.status(409).json({ error: 'Requested quantity exceeds available stock' });
    res.json({ data: await getCart(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.patch('/items/:vehicleId', async (req, res, next) => {
  try {
    const result = validateCartItem(req.body, false);
    if (result) return res.status(400).json({ error: result });

    const problem = await changeCartItemQuantity(req.user.id, req.params.vehicleId, req.body.quantity);
    if (problem === 'item_not_found') return res.status(404).json({ error: 'Cart item not found' });
    if (problem === 'insufficient_stock') return res.status(409).json({ error: 'Requested quantity exceeds available stock' });
    res.json({ data: await getCart(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:vehicleId', async (req, res, next) => {
  try {
    const deleted = await deleteCartItem(req.user.id, req.params.vehicleId);
    if (!deleted) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ data: await getCart(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    await deleteCartItems(req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
