import { Router } from 'express';
import { requireLogin, requireAdmin } from '../middleware/auth.js';
import { parseId } from '../middleware/parseId.js';
import { calculateSavings } from '../services/calculatorService.js';
import { getVehicleReviews, addVehicleReview } from '../services/reviewService.js';
import { listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../storage/vehicleStore.js';
import { validateListing, validateSavings, validateReview, validateVehicle } from '../validation/validators.js';

const router = Router();

router.param('id', parseId);

router.get('/', async (req, res) => {
  const result = validateListing(req.query);
  if (result) return res.status(400).json({ error: result });

  const vehicles = await listVehicles(req.query);
  res.json({ data: vehicles, count: vehicles.length });
});

router.get('/:id', async (req, res) => {
  const vehicle = await getVehicle(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json({ data: vehicle });
});

router.get('/:id/savings', async (req, res) => {
  const result = validateSavings(req.query);
  if (result) return res.status(400).json({ error: result });

  const vehicle = await getVehicle(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const toNumber = (value) => (value === undefined ? undefined : Number(value)); // undefined -> calculator default
  const savings = calculateSavings(vehicle, {
    kmPerYear: Number(req.query.kmPerYear),
    gasCarLPer100Km: toNumber(req.query.gasCarLPer100Km),
    gasPricePerL: toNumber(req.query.gasPricePerL),
    electricityPricePerKwh: toNumber(req.query.electricityPricePerKwh),
  });
  res.json({ data: savings });
});

router.get('/:id/reviews', async (req, res) => {
  const reviews = await getVehicleReviews(req.params.id);
  if (!reviews) return res.status(404).json({ error: 'Vehicle not found' });
  res.json({ data: reviews });
});

router.post('/:id/reviews', requireLogin, async (req, res) => {
  const result = validateReview(req.body);
  if (result) return res.status(400).json({ error: result });

  const { problem, review } = await addVehicleReview(req.user, req.params.id, req.body);
  if (problem === 'vehicle_not_found') return res.status(404).json({ error: 'Vehicle not found' });
  if (problem === 'not_verified_owner') return res.status(403).json({ error: 'Only verified owners of this vehicle can write a review' });
  if (problem === 'already_reviewed') return res.status(409).json({ error: 'You have already reviewed this vehicle' });
  res.status(201).json({ data: review });
});

router.post('/', requireAdmin, async (req, res) => {
  const result = validateVehicle(req.body, true);
  if (result) return res.status(400).json({ error: result });

  res.status(201).json({ data: await createVehicle(req.body) });
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const result = validateVehicle(req.body, false);
  if (result) return res.status(400).json({ error: result });

  const vehicle = await updateVehicle(req.params.id, req.body);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json({ data: vehicle });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const deleted = await deleteVehicle(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
  res.status(204).end();
});

export default router;
