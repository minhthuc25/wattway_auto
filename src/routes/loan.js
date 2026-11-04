import { Router } from 'express';
import { calculateLoan } from '../services/calculatorService.js';

const router = Router();

// Estimate the monthly payment on a vehicle loan, e.g. /api/loan?price=80000&downPayment=20000&rate=6&months=60
router.get('/', (req, res) => {
  const result = validateLoan(req.query);
  if (result) return res.status(400).json({ error: result });

  const { price, downPayment, rate, months } = req.query;
  const loan = calculateLoan({
    price: Number(price),
    downPayment: Number(downPayment),
    rate: Number(rate),
    months: Number(months),
  });
  res.json({ data: loan });
});

function validateLoan(query) {
  for (const param of ['price', 'downPayment', 'rate', 'months']) {
    if (query[param] === undefined || query[param] === '') return `Missing required parameter: ${param}`;
    if (!Number.isFinite(Number(query[param]))) return `${param} must be a number`;
  }

  const price = Number(query.price);
  const downPayment = Number(query.downPayment);
  const rate = Number(query.rate);
  const months = Number(query.months);

  if (price <= 0) return 'price must be greater than 0';
  if (downPayment < 0 || downPayment >= price) return 'downPayment must be at least 0 and less than price';
  // The upper limits on rate and months keep (1 + rate)^months from growing too large to calculate.
  if (rate < 0 || rate > 100) return 'rate must be a yearly percentage from 0 to 100';
  if (!Number.isInteger(months) || months < 1 || months > 120) return 'months must be a whole number from 1 to 120';

  return null;
}

export default router;
