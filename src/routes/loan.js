import { Router } from 'express';
import { calculateLoan } from '../services/calculatorService.js';
import { validateLoan } from '../validation/validators.js';

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

export default router;
