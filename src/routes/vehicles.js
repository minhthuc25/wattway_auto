import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { parseId } from '../middleware/parseId.js';
import { calculateSavings } from '../services/calculatorService.js';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../storage/vehicleStore.js';

const router = Router();

router.param('id', parseId);

router.get('/', async (req, res, next) => {
  try {
    const result = validateListing(req.query);
    if (result) return res.status(400).json({ error: result });

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

// Yearly cost and CO2 savings of this vehicle compared with a gas car.
router.get('/:id/savings', async (req, res, next) => {
  try {
    const result = validateSavings(req.query);
    if (result) return res.status(400).json({ error: result });

    const vehicle = await getVehicle(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Optional parameters that are left out stay undefined, so the calculator uses its defaults.
    const toNumber = (value) => (value === undefined ? undefined : Number(value));
    const savings = calculateSavings(vehicle, {
      kmPerYear: Number(req.query.kmPerYear),
      gasCarLPer100Km: toNumber(req.query.gasCarLPer100Km),
      gasPricePerL: toNumber(req.query.gasPricePerL),
      electricityPricePerKwh: toNumber(req.query.electricityPricePerKwh),
    });
    res.json({ data: savings });
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

function validateListing({ condition, available, year, hasAccidents, sort, order }) {
  if (condition !== undefined && !['new', 'used'].includes(condition)) return 'condition must be "new" or "used"';
  if (available !== undefined && !['true', 'false'].includes(available)) return 'available must be "true" or "false"';
  if (year !== undefined && !Number.isInteger(Number(year))) return 'year must be an integer';
  if (hasAccidents !== undefined && !['true', 'false'].includes(hasAccidents)) return 'hasAccidents must be "true" or "false"';
  if (sort !== undefined && !['price', 'mileageKm'].includes(sort)) return 'sort must be "price" or "mileageKm"';
  if (order !== undefined && !['asc', 'desc'].includes(order)) return 'order must be "asc" or "desc"';

  return null;
}

function validateSavings(query) {
  if (query.kmPerYear === undefined || query.kmPerYear === '') return 'Missing required parameter: kmPerYear';

  for (const param of ['kmPerYear', 'gasCarLPer100Km', 'gasPricePerL', 'electricityPricePerKwh']) {
    const value = query[param];
    if (value !== undefined && !(Number.isFinite(Number(value)) && Number(value) > 0)) return `${param} must be a positive number`;
  }

  return null;
}

function validateVehicle(body, creating) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object';

  // rangeKm and batteryKwh are required because the savings calculator uses them.
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
  if (body.year !== undefined && (!Number.isInteger(body.year) || body.year < 1886)) return 'year must be a valid integer';
  if (body.price !== undefined && (!Number.isInteger(body.price) || body.price < 0)) return 'price must be a non-negative integer';
  if (body.rangeKm !== undefined && (!Number.isInteger(body.rangeKm) || body.rangeKm <= 0)) return 'rangeKm must be a positive integer';
  if (body.batteryKwh !== undefined && (!Number.isFinite(body.batteryKwh) || body.batteryKwh <= 0)) return 'batteryKwh must be a positive number';
  if (body.mileageKm !== undefined && (!Number.isInteger(body.mileageKm) || body.mileageKm < 0)) return 'mileageKm must be a non-negative integer';
  if (body.quantity !== undefined && (!Number.isInteger(body.quantity) || body.quantity < 0)) return 'quantity must be a non-negative integer';
  if (body.hasAccidents !== undefined && typeof body.hasAccidents !== 'boolean') return 'hasAccidents must be a boolean';
  for (const field of ['trim', 'color', 'bodyType', 'historyReport', 'description', 'imageUrl']) {
    if (body[field] !== undefined && typeof body[field] !== 'string') return `${field} must be a string`;
  }
  if (body.available !== undefined) return 'available is derived from quantity and cannot be set';
  if (body.condition !== undefined && !['new', 'used'].includes(body.condition)) return 'condition must be "new" or "used"';

  return null;
}

export default router;
