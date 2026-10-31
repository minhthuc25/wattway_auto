import { Router } from 'express';
import { login, logout } from '../services/authService.js';
import { requireLogin } from '../middleware/auth.js';

const router = Router();

// Log in: returns a session token to send as "Authorization: Bearer <token>" on later requests.
router.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const session = await login(username, password);
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
