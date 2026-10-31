import { db } from './db.js';

// API field name -> database column. Only these fields can be written by clients.
const COLUMNS = {
  make: 'make',
  model: 'model',
  year: 'year',
  price: 'price',
  condition: 'condition',
  trim: 'trim',
  color: 'color',
  bodyType: 'body_type',
  rangeKm: 'range_km',
  batteryKwh: 'battery_kwh',
  mileageKm: 'mileage_km',
  hasAccidents: 'has_accidents',
  historyReport: 'history_report',
  quantity: 'quantity',
  description: 'description',
  imageUrl: 'image_url',
};

// Columns returned for a vehicle, renamed to the API's camelCase field names.
// `available` is derived from stock instead of stored, so the two can never disagree.
const VEHICLE_FIELDS = [
  'id',
  ...Object.entries(COLUMNS).map(([field, column]) => `${column} AS "${field}"`),
  'quantity > 0 AS available',
  'created_at AS "createdAt"',
  'updated_at AS "updatedAt"',
].join(', ');

// Returns the vehicle id as an integer, or null if it cannot be one (so lookups just find nothing).
function toId(id) {
  return /^\d{1,9}$/.test(String(id)) ? Number(id) : null;
}

// Picks the writable fields present in the input, in column order.
function writableEntries(input) {
  return Object.keys(COLUMNS)
    .filter((field) => input[field] !== undefined)
    .map((field) => {
      const value = field === 'make' || field === 'model' ? String(input[field]).trim() : input[field];
      return [COLUMNS[field], value];
    });
}

// Escapes LIKE wildcards so a search for "100%" matches the text literally.
function likePattern(text) {
  return `%${String(text).replace(/[\\%_]/g, '\\$&')}%`;
}

export async function listVehicles({ search, make, model, condition, available, year, bodyType, hasAccidents, sort, order } = {}) {
  const where = [];
  const params = [];
  // Adds a WHERE condition; every `?` in it refers to the same query parameter.
  const filter = (clause, value) => {
    params.push(value);
    where.push(clause.replaceAll('?', `$${params.length}`));
  };

  if (search) filter(`concat_ws(' ', make, model, trim, year, description) ILIKE ?`, likePattern(search));
  if (make) filter('lower(make) = lower(?)', String(make));
  if (model) filter('model ILIKE ?', likePattern(model));
  if (condition) filter('condition = ?', String(condition));
  if (available !== undefined) filter('(quantity > 0) = ?', String(available) === 'true');
  if (year) filter('year = ?', Number(year));
  if (bodyType) filter('lower(body_type) = lower(?)', String(bodyType));
  if (hasAccidents !== undefined) filter('has_accidents = ?', String(hasAccidents) === 'true');

  // ORDER BY cannot take a query parameter, so the column comes from the COLUMNS whitelist.
  const sortColumn = Object.hasOwn(COLUMNS, sort) ? COLUMNS[sort] : 'id';
  const direction = order === 'desc' ? 'DESC' : 'ASC';

  const { rows } = await db.query(
    `SELECT ${VEHICLE_FIELDS} FROM vehicles
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ${sortColumn} ${direction}, id`,
    params
  );
  return rows;
}

export async function getVehicle(id) {
  const vehicleId = toId(id);
  if (vehicleId === null) return null;
  const { rows } = await db.query(`SELECT ${VEHICLE_FIELDS} FROM vehicles WHERE id = $1`, [vehicleId]);
  return rows[0] ?? null;
}

export async function createVehicle(input) {
  const entries = writableEntries(input);
  const columns = entries.map(([column]) => column).join(', ');
  const placeholders = entries.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await db.query(
    `INSERT INTO vehicles (${columns}) VALUES (${placeholders}) RETURNING ${VEHICLE_FIELDS}`,
    entries.map(([, value]) => value)
  );
  return rows[0];
}

export async function updateVehicle(id, input) {
  const vehicleId = toId(id);
  if (vehicleId === null) return null;

  const entries = writableEntries(input);
  const assignments = entries.map(([column], i) => `${column} = $${i + 2}`);
  const { rows } = await db.query(
    `UPDATE vehicles SET ${[...assignments, 'updated_at = now()'].join(', ')}
     WHERE id = $1 RETURNING ${VEHICLE_FIELDS}`,
    [vehicleId, ...entries.map(([, value]) => value)]
  );
  return rows[0] ?? null;
}

export async function deleteVehicle(id) {
  const vehicleId = toId(id);
  if (vehicleId === null) return false;
  const { rows } = await db.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [vehicleId]);
  return rows.length > 0;
}
