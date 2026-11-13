import { db } from './db.js';

// API field -> database column
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

const VEHICLE_FIELDS = [
  'id',
  ...Object.entries(COLUMNS).map(([field, column]) => `${column} AS "${field}"`),
  'quantity > 0 AS available',
  'created_at AS "createdAt"',
  'updated_at AS "updatedAt"',
].join(', ');

function writableColumns(input) {
  const columns = [];
  const values = [];

  for (const [field, column] of Object.entries(COLUMNS)) {
    if (input[field] === undefined) continue;

    columns.push(column);
    values.push(field === 'make' || field === 'model' ? input[field].trim() : input[field]);
  }

  return { columns, values };
}

function likePattern(text) {
  return `%${String(text).replace(/[\\%_]/g, '\\$&')}%`; // escape LIKE wildcards
}

export async function listVehicles({ search, make, model, condition, available, year, bodyType, hasAccidents, sort, order } = {}) {
  const where = [];
  const params = [];
  const filter = (clause, value) => {
    params.push(value);
    where.push(clause.replaceAll('?', `$${params.length}`)); // ? becomes the next $n placeholder
  };

  if (search) filter(`concat_ws(' ', make, model, trim, year, description) ILIKE ?`, likePattern(search));
  if (make) filter('lower(make) = lower(?)', String(make));
  if (model) filter('model ILIKE ?', likePattern(model));
  if (condition) filter('condition = ?', String(condition));
  if (available !== undefined) filter('(quantity > 0) = ?', String(available) === 'true');
  if (year) filter('year = ?', Number(year));
  if (bodyType) filter('lower(body_type) = lower(?)', String(bodyType));
  if (hasAccidents !== undefined) filter('has_accidents = ?', String(hasAccidents) === 'true');

  const sortColumn = Object.hasOwn(COLUMNS, sort) ? COLUMNS[sort] : 'id'; // ORDER BY can't be a parameter, so only known columns
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
  const { rows } = await db.query(`SELECT ${VEHICLE_FIELDS} FROM vehicles WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createVehicle(input) {
  const { columns, values } = writableColumns(input);
  const placeholders = values.map((_, i) => `$${i + 1}`);
  const { rows } = await db.query(
    `INSERT INTO vehicles (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${VEHICLE_FIELDS}`,
    values
  );
  return rows[0];
}

export async function updateVehicle(id, input) {
  const { columns, values } = writableColumns(input);
  const assignments = columns.map((column, i) => `${column} = $${i + 2}`); // $1 is the id
  const { rows } = await db.query(
    `UPDATE vehicles SET ${[...assignments, 'updated_at = now()'].join(', ')}
     WHERE id = $1 RETURNING ${VEHICLE_FIELDS}`,
    [id, ...values]
  );
  return rows[0] ?? null;
}

export async function deleteVehicle(id) {
  const { rows } = await db.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);
  return rows.length > 0;
}

export async function decreaseVehicleStock(id, amount, tx) {
  await tx.query('UPDATE vehicles SET quantity = quantity - $2, updated_at = now() WHERE id = $1', [id, amount]);
}
