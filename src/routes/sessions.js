import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import { login, logout } from '../services/authService.js';
import { validateLogin } from '../validation/validators.js';

const router = Router();

router.post('/', async (req, res) => {
  const result = validateLogin(req.body);
  if (result) return res.status(400).json({ error: result });

  const session = await login(req.body.username, req.body.password);
  if (!session) return res.status(401).json({ error: 'Invalid username or password' }); // same message either way, so usernames can't be probed
  res.status(201).json({ data: session });
});

router.delete('/current', requireLogin, async (req, res) => {
  await logout(req.token);
  res.status(204).end();
});

export default router;
