import { db } from './db.js';

// Columns returned for a user, renamed to the API's camelCase field names. The password hash is never included.
const USER_FIELDS = 'id, username, first_name AS "firstName", last_name AS "lastName", role, created_at AS "createdAt"';

// Returns the new user, or null if the username is already taken.
export async function createUser({ username, passwordHash, firstName, lastName }) {
  const { rows } = await db.query(
    `INSERT INTO users (username, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO NOTHING RETURNING ${USER_FIELDS}`,
    [username, passwordHash, firstName, lastName]
  );
  return rows[0] ?? null;
}

// Also returns the password hash, for checking a login. Never send it to a client.
export async function findUserByUsername(username) {
  const { rows } = await db.query(`SELECT ${USER_FIELDS}, password_hash AS "passwordHash" FROM users WHERE username = $1`, [username]);
  return rows[0] ?? null;
}

export async function createSession(tokenHash, userId) {
  await db.query('INSERT INTO sessions (token_hash, user_id) VALUES ($1, $2)', [tokenHash, userId]);
}

// Returns the user who owns an unexpired session, or null.
export async function findUserBySession(tokenHash) {
  const { rows } = await db.query(
    `SELECT ${USER_FIELDS} FROM users JOIN sessions ON sessions.user_id = users.id
     WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
    [tokenHash]
  );
  return rows[0] ?? null;
}

export async function deleteSession(tokenHash) {
  await db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
}

export async function deleteExpiredSessions() {
  await db.query('DELETE FROM sessions WHERE expires_at <= now()');
}
