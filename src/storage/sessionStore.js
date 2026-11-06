import { db } from './db.js';
import { USER_FIELDS } from './userStore.js';

export async function createSession(tokenHash, userId) {
  await db.query('INSERT INTO sessions (token_hash, user_id) VALUES ($1, $2)', [tokenHash, userId]);
}

// Returns the user who owns an unexpired session, or null.
export async function getUserBySession(tokenHash) {
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
