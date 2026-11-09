import { db } from './db.js';

const REVIEW_FIELDS = 'reviews.vehicle_id AS "vehicleId", reviews.rating, reviews.comment, reviews.created_at AS "createdAt"';

// Returns a vehicle's reviews and who wrote them, newest first.
export async function listReviews(vehicleId) {
  const { rows } = await db.query(
    `SELECT users.username, ${REVIEW_FIELDS}
     FROM reviews JOIN users ON users.id = reviews.user_id
     WHERE reviews.vehicle_id = $1
     ORDER BY reviews.created_at DESC`,
    [vehicleId]
  );
  return rows;
}

// Returns the new review, or null if this user has already reviewed this vehicle.
export async function createReview(userId, vehicleId, { rating, comment = '' }) {
  const { rows } = await db.query(
    `INSERT INTO reviews (user_id, vehicle_id, rating, comment) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, vehicle_id) DO NOTHING RETURNING ${REVIEW_FIELDS}`,
    [userId, vehicleId, rating, comment]
  );
  return rows[0] ?? null;
}
