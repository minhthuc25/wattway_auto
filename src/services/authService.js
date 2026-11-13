import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createUser, getUserByUsername } from '../storage/userStore.js';
import { createSession, getUserBySession, deleteSession, deleteExpiredSessions } from '../storage/sessionStore.js';

const scryptAsync = promisify(scrypt);

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

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

export async function register({ username, password, firstName, lastName, defaultShipping }) {
  return createUser({
    username: normalizeUsername(username),
    passwordHash: await hashPassword(password),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    defaultShipping,
  });
}

export async function login(username, password) {
  const account = await getUserByUsername(normalizeUsername(username));
  if (!account || !(await verifyPassword(password, account.passwordHash))) return null;

  await deleteExpiredSessions(); // tidy up old sessions while we're adding one
  const token = randomBytes(32).toString('hex');
  await createSession(hashToken(token), account.id); // only the hash is stored

  const { passwordHash, ...user } = account;
  return { token, user };
}

export async function logout(token) {
  await deleteSession(hashToken(token));
}

export async function getUserForToken(token) {
  return getUserBySession(hashToken(token));
}
