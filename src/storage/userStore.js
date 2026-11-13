import { db } from './db.js';

export const SHIPPING_OBJECT = `jsonb_build_object(
  'street', shipping_street,
  'city', shipping_city,
  'province', shipping_province,
  'country', shipping_country,
  'postalCode', shipping_postal_code
)`;

// all null when there's no address
export function shippingValues({ street = null, city = null, province = null, country = null, postalCode = null } = {}) {
  return [street, city, province, country, postalCode];
}

export const USER_FIELDS = `id, username, first_name AS "firstName", last_name AS "lastName", role, created_at AS "createdAt",
  CASE WHEN shipping_street IS NULL THEN NULL ELSE ${SHIPPING_OBJECT} END AS "defaultShipping"`;

export async function createUser({ username, passwordHash, firstName, lastName, defaultShipping }) {
  const { rows } = await db.query(
    `INSERT INTO users (username, password_hash, first_name, last_name,
                        shipping_street, shipping_city, shipping_province, shipping_country, shipping_postal_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (username) DO NOTHING RETURNING ${USER_FIELDS}`,
    [username, passwordHash, firstName, lastName, ...shippingValues(defaultShipping)]
  );
  return rows[0] ?? null; // null if the username is taken
}

// includes the password hash, so only use it for checking logins
export async function getUserByUsername(username) {
  const { rows } = await db.query(`SELECT ${USER_FIELDS}, password_hash AS "passwordHash" FROM users WHERE username = $1`, [username]);
  return rows[0] ?? null;
}

export async function updateDefaultShipping(userId, defaultShipping) {
  const { rows } = await db.query(
    `UPDATE users SET shipping_street = $2, shipping_city = $3, shipping_province = $4, shipping_country = $5, shipping_postal_code = $6
     WHERE id = $1 RETURNING ${USER_FIELDS}`,
    [userId, ...shippingValues(defaultShipping)]
  );
  return rows[0];
}
