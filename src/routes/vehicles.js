import { Router } from 'express';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../storage/vehicleStore.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { year, sort, order } = req.query;
    if (year !== undefined && !Number.isInteger(Number(year))) return res.status(400).json({ error: 'year must be an integer' });
    if (sort !== undefined && !['price', 'mileageKm'].includes(sort)) return res.status(400).json({ error: 'sort must be "price" or "mileageKm"' });
    if (order !== undefined && !['asc', 'desc'].includes(order)) return res.status(400).json({ error: 'order must be "asc" or "desc"' });

    // Filtering and sorting happen in the database query.
    const vehicles = await listVehicles(req.query);
    res.json({ data: vehicles, count: vehicles.length });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const vehicle = await getVehicle(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ data: vehicle });
  } catch (err) {
    next(err);
  }
});

// Only admins can change the inventory.
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const result = validateVehicle(req.body, true);
    if (result) return res.status(400).json({ error: result });

    const vehicle = await createVehicle(req.body);
    res.status(201).json({ data: vehicle });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const result = validateVehicle(req.body, false);
    if (result) return res.status(400).json({ error: result });

    const vehicle = await updateVehicle(req.params.id, req.body);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ data: vehicle });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const deleted = await deleteVehicle(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

function validateVehicle(body, creating) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object';

  // rangeKm and batteryKwh are required because the savings calculator derives efficiency from them.
  const required = ['make', 'model', 'year', 'price', 'rangeKm', 'batteryKwh'];
  if (creating) {
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return `Missing required field: ${field}`;
      }
    }
  }

  if (body.make !== undefined && (typeof body.make !== 'string' || !body.make.trim())) return 'make must be a non-empty string';
  if (body.model !== undefined && (typeof body.model !== 'string' || !body.model.trim())) return 'model must be a non-empty string';
  if (body.year !== undefined && (!Number.isInteger(Number(body.year)) || Number(body.year) < 1886)) return 'year must be a valid integer';
  if (body.price !== undefined && (!Number.isInteger(Number(body.price)) || Number(body.price) < 0)) return 'price must be a non-negative integer';
  if (body.rangeKm !== undefined && (!Number.isInteger(Number(body.rangeKm)) || Number(body.rangeKm) <= 0)) return 'rangeKm must be a positive integer';
  if (body.batteryKwh !== undefined && (!Number.isFinite(Number(body.batteryKwh)) || Number(body.batteryKwh) <= 0)) return 'batteryKwh must be a positive number';
  if (body.mileageKm !== undefined && (!Number.isInteger(Number(body.mileageKm)) || Number(body.mileageKm) < 0)) return 'mileageKm must be a non-negative integer';
  if (body.quantity !== undefined && (!Number.isInteger(Number(body.quantity)) || Number(body.quantity) < 0)) return 'quantity must be a non-negative integer';
  if (body.hasAccidents !== undefined && typeof body.hasAccidents !== 'boolean') return 'hasAccidents must be a boolean';
  for (const field of ['trim', 'color', 'bodyType', 'historyReport', 'description', 'imageUrl']) {
    if (body[field] !== undefined && typeof body[field] !== 'string') return `${field} must be a string`;
  }
  if (body.available !== undefined) return 'available is derived from quantity and cannot be set';
  if (body.condition !== undefined && !['new', 'used'].includes(body.condition)) return 'condition must be "new" or "used"';

  return null;
}

export default router;
