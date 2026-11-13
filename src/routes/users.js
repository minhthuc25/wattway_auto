import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import { register } from '../services/authService.js';
import { updateDefaultShipping } from '../storage/userStore.js';
import { validateUserUpdate, validateRegistration } from '../validation/validators.js';

const router = Router();

router.post('/', async (req, res) => {
  const result = validateRegistration(req.body);
  if (result) return res.status(400).json({ error: result });

  const user = await register(req.body);
  if (!user) return res.status(409).json({ error: 'This username is already taken' });
  res.status(201).json({ data: user });
});

router.get('/me', requireLogin, (req, res) => {
  res.json({ data: req.user });
});

router.patch('/me', requireLogin, async (req, res) => {
  const result = validateUserUpdate(req.body);
  if (result) return res.status(400).json({ error: result });

  res.json({ data: await updateDefaultShipping(req.user.id, req.body.defaultShipping) });
});

export default router;
