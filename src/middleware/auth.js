import { getUserForToken } from '../services/authService.js';

function bearerToken(req) {
  const [scheme, token] = (req.get('Authorization') ?? '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

export async function requireLogin(req, res, next) {
  const token = bearerToken(req);
  const user = token ? await getUserForToken(token) : null;
  if (!user) return res.status(401).json({ error: 'Login required' });

  req.user = user;
  req.token = token;
  next();
}

export function requireAdmin(req, res, next) {
  return requireLogin(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}
