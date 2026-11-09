import { db } from './db.js';

const TEST_DRIVE_FIELDS = 'id, user_id AS "userId", vehicle_id AS "vehicleId", type, scheduled_at AS "scheduledAt", address, status, created_at AS "createdAt"';

// Returns the user's test drives, soonest first.
export async function listTestDrives(userId) {
  const { rows } = await db.query(`SELECT ${TEST_DRIVE_FIELDS} FROM test_drives WHERE user_id = $1 ORDER BY scheduled_at`, [userId]);
  return rows;
}

export async function listAllTestDrives() {
  const { rows } = await db.query(`SELECT ${TEST_DRIVE_FIELDS} FROM test_drives ORDER BY scheduled_at`);
  return rows;
}

export async function getTestDrive(id) {
  const { rows } = await db.query(`SELECT ${TEST_DRIVE_FIELDS} FROM test_drives WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

// Returns the new test drive, or null if that time slot is already booked for this vehicle.
export async function createTestDrive(userId, vehicleId, type, scheduledAt, address) {
  const { rows } = await db.query(
    `INSERT INTO test_drives (user_id, vehicle_id, type, scheduled_at, address) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (vehicle_id, scheduled_at) WHERE status = 'SCHEDULED' DO NOTHING RETURNING ${TEST_DRIVE_FIELDS}`,
    [userId, vehicleId, type, scheduledAt, address]
  );
  return rows[0] ?? null;
}

export async function updateTestDriveStatus(id, status) {
  const { rows } = await db.query(`UPDATE test_drives SET status = $2 WHERE id = $1 RETURNING ${TEST_DRIVE_FIELDS}`, [id, status]);
  return rows[0];
}
