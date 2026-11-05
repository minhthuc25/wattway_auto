import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  setCartItemQuantity,
} from '../storage/cartStore.js';

const router = Router();

router.use(requireLogin);

router.get('/', async (req, res, next) => {
  try {
    res.json({ data: await getCart(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.post('/items', async (req, res, next) => {
  try {
    const result = validateCartItem(req.body);
    if (result) return res.status(400).json({ error: result });

    const { vehicleId, quantity = 1 } = req.body;
    const added = await addCartItem(req.user.id, vehicleId, quantity);
    if (added === 'vehicle_not_found') return res.status(404).json({ error: 'Vehicle not found' });
    if (added === 'insufficient_stock') return res.status(409).json({ error: 'Requested quantity exceeds available stock' });
    res.json({ data: await getCart(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.patch('/items/:vehicleId', async (req, res, next) => {
  try {
    const vehicleId = parseVehicleId(req.params.vehicleId);
    if (vehicleId === null) return res.status(400).json({ error: 'vehicleId must be a positive integer' });
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object' });
    }
    if (!Number.isInteger(req.body.quantity) || req.body.quantity <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    const updated = await setCartItemQuantity(req.user.id, vehicleId, req.body.quantity);
    if (updated === 'item_not_found') return res.status(404).json({ error: 'Cart item not found' });
    if (updated === 'insufficient_stock') return res.status(409).json({ error: 'Requested quantity exceeds available stock' });
    res.json({ data: await getCart(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:vehicleId', async (req, res, next) => {
  try {
    const vehicleId = parseVehicleId(req.params.vehicleId);
    if (vehicleId === null) return res.status(400).json({ error: 'vehicleId must be a positive integer' });

    const removed = await removeCartItem(req.user.id, vehicleId);
    if (!removed) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ data: await getCart(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    await clearCart(req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

function parseVehicleId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateCartItem(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object';
  if (!Number.isSafeInteger(body.vehicleId) || body.vehicleId <= 0) return 'vehicleId must be a positive integer';
  if (body.quantity !== undefined && (!Number.isSafeInteger(body.quantity) || body.quantity <= 0)) {
    return 'quantity must be a positive integer';
  }
  return null;
}

export default router;
