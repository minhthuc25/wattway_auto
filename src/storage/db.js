import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, '../../db');

// PGlite is PostgreSQL running inside this Node process, so no separate database server is needed.
// Its data is kept on disk in db/pgdata.
export const db = new PGlite(path.join(DB_DIR, 'pgdata'));

// On first start the database is empty: create the tables and load the sample data.
// Both files run in one exec call, which PostgreSQL treats as a single transaction.
const { rows } = await db.query(`SELECT to_regclass('vehicles') AS existing`);
if (!rows[0].existing) {
  const schema = await readFile(path.join(DB_DIR, 'schema.sql'), 'utf8');
  const seed = await readFile(path.join(DB_DIR, 'seed.sql'), 'utf8');
  await db.exec(`${schema}\n${seed}`);
  console.log('Database created and seeded');
}
