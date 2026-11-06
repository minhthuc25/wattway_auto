// For router.param: rejects an id in the URL that is not a positive integer, and converts valid ones to a number.
export function parseId(req, res, next, value, name) {
  if (!/^[1-9]\d{0,8}$/.test(value)) return res.status(400).json({ error: `${name} must be a positive integer` });

  req.params[name] = Number(value);
  next();
}
