import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, '../../db');

// PGlite is PostgreSQL running inside this Node process, so no separate database server is needed.
// Its data is kept on disk in db/pgdata.
export const db = new PGlite(path.join(DB_DIR, 'pgdata'));

// The schema runs on every start so existing databases receive new tables; tables that already exist are left as they are.
// The sample data is only loaded into a new database.
const { rows } = await db.query(`SELECT to_regclass('vehicles') AS existing`);
const schema = await readFile(path.join(DB_DIR, 'schema.sql'), 'utf8');
if (!rows[0].existing) {
  const seed = await readFile(path.join(DB_DIR, 'seed.sql'), 'utf8');
  await db.exec(`${schema}\n${seed}`);
  console.log('Database created and seeded');
} else {
  await db.exec(schema);
}
