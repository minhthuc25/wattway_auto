import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import {
  createUser,
  findUserByUsername,
  createSession,
  findUserBySession,
  deleteSession,
  deleteExpiredSessions,
} from '../storage/userStore.js';

const scryptAsync = promisify(scrypt);

// Passwords are stored as "salt:hash" using scrypt, so the password itself is never saved.
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = await scryptAsync(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

// Session tokens are looked up by their hash, matching what the sessions table stores.
function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

// Usernames are case-insensitive: "JSmith" and "jsmith" are the same account.
function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

// Creates a customer account. Returns the new user, or null if the username is already taken.
export async function register({ username, password, firstName, lastName }) {
  return createUser({
    username: normalizeUsername(username),
    passwordHash: await hashPassword(password),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
  });
}

// Returns { token, user }, or null if the username or the password is wrong (without saying which).
export async function login(username, password) {
  const account = await findUserByUsername(normalizeUsername(username));
  if (!account || !(await verifyPassword(password, account.passwordHash))) return null;

  // Remove rows from the session table that represent expired sessions before adding a new one
  await deleteExpiredSessions();
  const token = randomBytes(32).toString('hex');
  await createSession(hashToken(token), account.id);

  const { passwordHash, ...user } = account;
  return { token, user };
}

export async function logout(token) {
  await deleteSession(hashToken(token));
}

// Returns the logged-in user for a session token, or null if it is unknown or expired.
export async function userForToken(token) {
  return findUserBySession(hashToken(token));
}
