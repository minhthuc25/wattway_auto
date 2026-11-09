import { Router } from 'express';
import { requireLogin, requireAdmin } from '../middleware/auth.js';
import { parseId } from '../middleware/parseId.js';
import { calculateSavings } from '../services/calculatorService.js';
import { getVehicleReviews, addVehicleReview } from '../services/reviewService.js';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../storage/vehicleStore.js';
import { validateListing, validateSavings, validateReview, validateVehicle } from '../validation/validators.js';

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

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await getVehicleReviews(req.params.id);
    if (!reviews) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ data: reviews });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reviews', requireLogin, async (req, res, next) => {
  try {
    const result = validateReview(req.body);
    if (result) return res.status(400).json({ error: result });

    const { problem, review } = await addVehicleReview(req.user, req.params.id, req.body);
    if (problem === 'vehicle_not_found') return res.status(404).json({ error: 'Vehicle not found' });
    if (problem === 'not_verified_owner') return res.status(403).json({ error: 'Only verified owners of this vehicle can write a review' });
    if (problem === 'already_reviewed') return res.status(409).json({ error: 'You have already reviewed this vehicle' });
    res.status(201).json({ data: review });
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

export default router;
