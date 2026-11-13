const SAVINGS_DEFAULTS = {
  gasCarLPer100Km: 8.5,
  gasPricePerL: 1.55,
  electricityPricePerKwh: 0.13,
};

const CO2_KG_PER_L_GAS = 2.31;
const GRID_CO2_KG_PER_KWH = 0.03; // Ontario grid

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateLoan({ price, downPayment, rate, months }) {
  const loanAmount = price - downPayment;
  const monthlyRate = rate / 100 / 12;

  // P * r * (1 + r)^n / ((1 + r)^n - 1), or just P / n at 0%
  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / months
      : (loanAmount * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);

  return {
    loanAmount: round(loanAmount, 2),
    monthlyPayment: round(monthlyPayment, 2),
    totalInterest: round(monthlyPayment * months - loanAmount, 2),
  };
}

export function calculateSavings(
  vehicle,
  {
    kmPerYear,
    gasCarLPer100Km = SAVINGS_DEFAULTS.gasCarLPer100Km,
    gasPricePerL = SAVINGS_DEFAULTS.gasPricePerL,
    electricityPricePerKwh = SAVINGS_DEFAULTS.electricityPricePerKwh,
  }
) {
  const kwhPer100Km = (vehicle.batteryKwh / vehicle.rangeKm) * 100;
  const evKwh = (kmPerYear / 100) * kwhPer100Km;
  const gasLitres = (kmPerYear / 100) * gasCarLPer100Km;

  const evEnergyCost = evKwh * electricityPricePerKwh;
  const gasFuelCost = gasLitres * gasPricePerL;
  const evCo2Kg = evKwh * GRID_CO2_KG_PER_KWH;
  const gasCo2Kg = gasLitres * CO2_KG_PER_L_GAS;

  return {
    vehicleId: vehicle.id,
    kmPerYear,
    kwhPer100Km: round(kwhPer100Km, 1),
    yearly: {
      evEnergyCost: round(evEnergyCost, 2),
      gasFuelCost: round(gasFuelCost, 2),
      costSavings: round(gasFuelCost - evEnergyCost, 2),
      evCo2Kg: round(evCo2Kg, 1),
      gasCo2Kg: round(gasCo2Kg, 1),
      co2SavedKg: round(gasCo2Kg - evCo2Kg, 1),
    },
    assumptions: {
      gasCarLPer100Km,
      gasPricePerL,
      electricityPricePerKwh,
      co2KgPerLGas: CO2_KG_PER_L_GAS,
      gridCo2KgPerKwh: GRID_CO2_KG_PER_KWH,
    },
  };
}
