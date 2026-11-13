function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateShipping(shipping, name) {
  if (!isObject(shipping)) return `Missing required field: ${name}`;

  for (const field of ['street', 'city', 'province', 'country', 'postalCode']) {
    if (typeof shipping[field] !== 'string' || !shipping[field].trim()) return `Missing required field: ${name}.${field}`;
  }

  return null;
}

export function validateRegistration(body) {
  if (!isObject(body)) return 'Request body must be a JSON object';

  for (const field of ['username', 'password', 'firstName', 'lastName']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) return `Missing required field: ${field}`;
  }
  if (!/^[a-z0-9._-]{3,30}$/i.test(body.username.trim())) {
    return 'username must be 3-30 characters: letters, digits, ".", "_" or "-"';
  }
  if (body.password.length < 8) return 'password must be at least 8 characters';

  if (body.defaultShipping !== undefined) return validateShipping(body.defaultShipping, 'defaultShipping'); // optional, but must be complete

  return null;
}

export function validateUserUpdate(body) {
  if (!isObject(body)) return 'Request body must be a JSON object';
  return validateShipping(body.defaultShipping, 'defaultShipping');
}

export function validateLogin(body) {
  if (!isObject(body)) return 'Request body must be a JSON object';

  for (const field of ['username', 'password']) {
    if (typeof body[field] !== 'string') return `Missing required field: ${field}`;
  }

  return null;
}

export function validateListing({ condition, available, year, hasAccidents, sort, order }) {
  if (condition !== undefined && !['new', 'used'].includes(condition)) return 'condition must be "new" or "used"';
  if (available !== undefined && !['true', 'false'].includes(available)) return 'available must be "true" or "false"';
  if (year !== undefined && !Number.isInteger(Number(year))) return 'year must be an integer';
  if (hasAccidents !== undefined && !['true', 'false'].includes(hasAccidents)) return 'hasAccidents must be "true" or "false"';
  if (sort !== undefined && !['price', 'mileageKm'].includes(sort)) return 'sort must be "price" or "mileageKm"';
  if (order !== undefined && !['asc', 'desc'].includes(order)) return 'order must be "asc" or "desc"';

  return null;
}

export function validateVehicle(body, creating) {
  if (!isObject(body)) return 'Request body must be a JSON object';

  const required = ['make', 'model', 'year', 'price', 'rangeKm', 'batteryKwh']; // range + battery feed the savings calculator
  if (creating) {
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return `Missing required field: ${field}`;
      }
    }
  }

  if (body.make !== undefined && (typeof body.make !== 'string' || !body.make.trim())) return 'make must be a non-empty string';
  if (body.model !== undefined && (typeof body.model !== 'string' || !body.model.trim())) return 'model must be a non-empty string';
  if (body.year !== undefined && (!Number.isInteger(body.year) || body.year < 1886)) return 'year must be a valid integer';
  if (body.price !== undefined && (!Number.isInteger(body.price) || body.price < 0)) return 'price must be a non-negative integer';
  if (body.rangeKm !== undefined && (!Number.isInteger(body.rangeKm) || body.rangeKm <= 0)) return 'rangeKm must be a positive integer';
  if (body.batteryKwh !== undefined && (!Number.isFinite(body.batteryKwh) || body.batteryKwh <= 0)) return 'batteryKwh must be a positive number';
  if (body.mileageKm !== undefined && (!Number.isInteger(body.mileageKm) || body.mileageKm < 0)) return 'mileageKm must be a non-negative integer';
  if (body.quantity !== undefined && (!Number.isInteger(body.quantity) || body.quantity < 0)) return 'quantity must be a non-negative integer';
  if (body.hasAccidents !== undefined && typeof body.hasAccidents !== 'boolean') return 'hasAccidents must be a boolean';
  for (const field of ['trim', 'color', 'bodyType', 'historyReport', 'description', 'imageUrl']) {
    if (body[field] !== undefined && typeof body[field] !== 'string') return `${field} must be a string`;
  }
  if (body.available !== undefined) return 'available is derived from quantity and cannot be set';
  if (body.condition !== undefined && !['new', 'used'].includes(body.condition)) return 'condition must be "new" or "used"';

  return null;
}

export function validateReview(body) {
  if (!isObject(body)) return 'Request body must be a JSON object';

  if (body.rating === undefined) return 'Missing required field: rating';
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) return 'rating must be a whole number from 1 to 5';
  if (body.comment !== undefined && typeof body.comment !== 'string') return 'comment must be a string';

  return null;
}

export function validateTestDrive(body) {
  if (!isObject(body)) return 'Request body must be a JSON object';
  if (!Number.isInteger(body.vehicleId) || body.vehicleId <= 0) return 'vehicleId must be a positive integer';
  if (!['at_home', 'virtual'].includes(body.type)) return 'type must be "at_home" or "virtual"';

  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/; // time zone required
  if (typeof body.scheduledAt !== 'string' || !iso.test(body.scheduledAt) || Number.isNaN(Date.parse(body.scheduledAt))) {
    return 'scheduledAt must be a date and time with a time zone, e.g. 2026-12-01T15:00:00-05:00';
  }
  const scheduledAt = new Date(body.scheduledAt);
  if (scheduledAt <= new Date()) return 'scheduledAt must be in the future';
  if (scheduledAt.getUTCMinutes() !== 0 || scheduledAt.getUTCSeconds() !== 0) return 'scheduledAt must be on the hour';

  if (body.type === 'at_home' && (typeof body.address !== 'string' || !body.address.trim())) {
    return 'address is required for an at-home test drive';
  }

  return null;
}

export function validateTestDriveUpdate(body) {
  if (!isObject(body)) return 'Request body must be a JSON object';
  if (body.status !== 'CANCELLED') return 'status must be "CANCELLED"';

  return null;
}

export function validateSavings(query) {
  if (query.kmPerYear === undefined || query.kmPerYear === '') return 'Missing required parameter: kmPerYear';

  for (const param of ['kmPerYear', 'gasCarLPer100Km', 'gasPricePerL', 'electricityPricePerKwh']) {
    const value = query[param];
    if (value !== undefined && !(Number.isFinite(Number(value)) && Number(value) > 0)) return `${param} must be a positive number`;
  }

  return null;
}

export function validateLoan(query) {
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
  if (rate < 0 || rate > 100) return 'rate must be a yearly percentage from 0 to 100'; // caps stop (1 + r)^n overflowing
  if (!Number.isInteger(months) || months < 1 || months > 120) return 'months must be a whole number from 1 to 120';

  return null;
}

export function validateCartItem(body, creating) {
  if (!isObject(body)) return 'Request body must be a JSON object';
  if (creating && (!Number.isInteger(body.vehicleId) || body.vehicleId <= 0)) return 'vehicleId must be a positive integer';

  if (creating && body.quantity === undefined) return null; // defaults to 1 when adding
  if (!Number.isInteger(body.quantity) || body.quantity <= 0) return 'quantity must be a positive integer';

  return null;
}

function isExpired(expiry) {
  const [month, year] = expiry.split('/').map(Number);
  const firstDayAfterExpiry = new Date(2000 + year, month); // month is 0-based here, so this is the 1st of the next month
  return firstDayAfterExpiry <= new Date();
}

export function validateCheckout(body) {
  if (!isObject(body)) return 'Request body must be a JSON object';

  const shippingError = validateShipping(body.shipping, 'shipping');
  if (shippingError) return shippingError;

  if (!isObject(body.card)) return 'Missing required field: card';
  const { number, expiry, cvv } = body.card;
  if (typeof number !== 'string' || !/^\d{13,19}$/.test(number)) return 'card.number must be 13 to 19 digits';
  if (typeof expiry !== 'string' || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return 'card.expiry must be in MM/YY format';
  if (isExpired(expiry)) return 'card has expired';
  if (typeof cvv !== 'string' || !/^\d{3,4}$/.test(cvv)) return 'card.cvv must be 3 or 4 digits';

  return null;
}
