import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import { register } from '../services/authService.js';
import { updateDefaultShipping } from '../storage/userStore.js';
import { validateUserUpdate, validateRegistration } from '../validation/validators.js';

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

// Change the logged-in user's default shipping address.
router.patch('/me', requireLogin, async (req, res, next) => {
  try {
    const result = validateUserUpdate(req.body);
    if (result) return res.status(400).json({ error: result });

    res.json({ data: await updateDefaultShipping(req.user.id, req.body.defaultShipping) });
  } catch (err) {
    next(err);
  }
});

export default router;
