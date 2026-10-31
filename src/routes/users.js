import { Router } from 'express';
import { register } from '../services/authService.js';
import { requireLogin } from '../middleware/auth.js';

const router = Router();

// Register a customer account. Logging in is a separate step (POST /api/sessions).
router.post('/', async (req, res, next) => {
  try {
    const result = validateRegistration(req.body);
    if (result) return res.status(400).json({ error: result });

    const user = await register(req.body);
    if (!user) return res.status(409).json({ error: 'This username is already taken' });
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
});

// The logged-in user's own account.
router.get('/me', requireLogin, (req, res) => {
  res.json({ data: req.user });
});

function validateRegistration(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object';

  for (const field of ['username', 'password', 'firstName', 'lastName']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) return `Missing required field: ${field}`;
  }
  if (!/^[a-z0-9._-]{3,30}$/i.test(body.username.trim())) {
    return 'username must be 3-30 characters: letters, digits, ".", "_" or "-"';
  }
  if (body.password.length < 8) return 'password must be at least 8 characters';

  return null;
}

export default router;
