import { Router } from 'express';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../storage/vehicleStore.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { search, make, model, condition, available } = req.query;
    let vehicles = await listVehicles();

    if (search) {
      const q = String(search).toLowerCase();
      vehicles = vehicles.filter((v) =>
        [v.make, v.model, v.trim, v.year, v.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      );
    }
    if (make) vehicles = vehicles.filter((v) => v.make.toLowerCase() === String(make).toLowerCase());
    if (model) vehicles = vehicles.filter((v) => v.model.toLowerCase().includes(String(model).toLowerCase()));
    if (condition) vehicles = vehicles.filter((v) => v.condition === condition);
    if (available !== undefined) vehicles = vehicles.filter((v) => v.available === (String(available) === 'true'));

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

router.post('/', async (req, res, next) => {
  try {
    const result = validateVehicle(req.body, true);
    if (result) return res.status(400).json({ error: result });

    const vehicle = await createVehicle(req.body);
    res.status(201).json({ data: vehicle });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
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

router.delete('/:id', async (req, res, next) => {
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

  const required = ['make', 'model', 'year', 'price'];
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
  if (body.price !== undefined && (!Number.isFinite(Number(body.price)) || Number(body.price) < 0)) return 'price must be a non-negative number';
  if (body.rangeKm !== undefined && (!Number.isFinite(Number(body.rangeKm)) || Number(body.rangeKm) < 0)) return 'rangeKm must be a non-negative number';
  if (body.batteryKwh !== undefined && (!Number.isFinite(Number(body.batteryKwh)) || Number(body.batteryKwh) < 0)) return 'batteryKwh must be a non-negative number';
  if (body.quantity !== undefined && (!Number.isInteger(Number(body.quantity)) || Number(body.quantity) < 0)) return 'quantity must be a non-negative integer';
  if (body.available !== undefined) return 'available is derived from quantity and cannot be set';
  if (body.condition !== undefined && !['new', 'used'].includes(body.condition)) return 'condition must be "new" or "used"';

  return null;
}

export default router;
