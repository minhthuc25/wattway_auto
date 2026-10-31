import { userForToken } from '../services/authService.js';

// Reads the session token from an "Authorization: Bearer <token>" header.
function bearerToken(req) {
  const [scheme, token] = (req.get('Authorization') ?? '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

// Lets the request through only with a valid session token, and sets req.user and req.token for the route.
export async function requireLogin(req, res, next) {
  try {
    const token = bearerToken(req);
    const user = token ? await userForToken(token) : null;
    if (!user) return res.status(401).json({ error: 'Login required' });

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

// Lets the request through only for a logged-in admin.
export function requireAdmin(req, res, next) {
  requireLogin(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}
