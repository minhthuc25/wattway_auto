import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import { parseId } from '../middleware/parseId.js';
import { getTestDrivesFor, bookTestDrive, cancelTestDrive } from '../services/testDriveService.js';
import { validateTestDrive, validateTestDriveUpdate } from '../validation/validators.js';

const router = Router();

router.use(requireLogin);
router.param('id', parseId);

router.post('/', async (req, res) => {
  const result = validateTestDrive(req.body);
  if (result) return res.status(400).json({ error: result });

  const { problem, testDrive } = await bookTestDrive(req.user.id, req.body);
  if (problem === 'vehicle_not_found') return res.status(404).json({ error: 'Vehicle not found' });
  if (problem === 'vehicle_unavailable') return res.status(409).json({ error: 'This vehicle is no longer available' });
  if (problem === 'slot_taken') return res.status(409).json({ error: 'This time slot is already booked for this vehicle' });
  res.status(201).json({ data: testDrive });
});

router.get('/', async (req, res) => {
  const testDrives = await getTestDrivesFor(req.user);
  res.json({ data: testDrives, count: testDrives.length });
});

router.patch('/:id', async (req, res) => {
  const result = validateTestDriveUpdate(req.body);
  if (result) return res.status(400).json({ error: result });

  const { problem, testDrive } = await cancelTestDrive(req.user, req.params.id);
  if (problem === 'not_found') return res.status(404).json({ error: 'Test drive not found' });
  if (problem === 'already_cancelled') return res.status(409).json({ error: 'This test drive is already cancelled' });
  res.json({ data: testDrive });
});

export default router;
