import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import { login, logout } from '../services/authService.js';
import { validateLogin } from '../validation/validators.js';

const router = Router();

// Log in: returns a session token to send as "Authorization: Bearer <token>" on later requests.
router.post('/', async (req, res, next) => {
  try {
    const result = validateLogin(req.body);
    if (result) return res.status(400).json({ error: result });

    const session = await login(req.body.username, req.body.password);
    // The same message for a wrong username or a wrong password, so it cannot be used to find accounts.
    if (!session) return res.status(401).json({ error: 'Invalid username or password' });
    res.status(201).json({ data: session });
  } catch (err) {
    next(err);
  }
});

// Log out: ends the session whose token was sent with the request.
router.delete('/current', requireLogin, async (req, res, next) => {
  try {
    await logout(req.token);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
