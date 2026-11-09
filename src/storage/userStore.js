import { db } from './db.js';

// Builds the API's shipping object from the five shipping columns. Also used by orderStore.
export const SHIPPING_OBJECT = `jsonb_build_object(
  'street', shipping_street,
  'city', shipping_city,
  'province', shipping_province,
  'country', shipping_country,
  'postalCode', shipping_postal_code
)`;

// The values for the five shipping columns, all null if there is no address. Also used by orderStore.
export function shippingValues({ street = null, city = null, province = null, country = null, postalCode = null } = {}) {
  return [street, city, province, country, postalCode];
}

// Columns returned for a user, renamed to the API's camelCase field names. The password hash is never included.
// Also used by sessionStore to return the user who owns a session.
export const USER_FIELDS = `id, username, first_name AS "firstName", last_name AS "lastName", role, created_at AS "createdAt",
  CASE WHEN shipping_street IS NULL THEN NULL ELSE ${SHIPPING_OBJECT} END AS "defaultShipping"`;

// Returns the new user, or null if the username is already taken.
export async function createUser({ username, passwordHash, firstName, lastName, defaultShipping }) {
  const { rows } = await db.query(
    `INSERT INTO users (username, password_hash, first_name, last_name,
                        shipping_street, shipping_city, shipping_province, shipping_country, shipping_postal_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (username) DO NOTHING RETURNING ${USER_FIELDS}`,
    [username, passwordHash, firstName, lastName, ...shippingValues(defaultShipping)]
  );
  return rows[0] ?? null;
}

// Also returns the password hash, for checking a login. Never send it to a client.
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
