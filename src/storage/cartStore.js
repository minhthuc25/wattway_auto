import { db } from './db.js';

export async function listCartItems(userId) {
  const { rows } = await db.query(
    'SELECT vehicle_id AS "vehicleId", quantity FROM cart_items WHERE user_id = $1 ORDER BY vehicle_id',
    [userId]
  );
  return rows;
}

export async function getCartItemQuantity(userId, vehicleId) {
  const { rows } = await db.query('SELECT quantity FROM cart_items WHERE user_id = $1 AND vehicle_id = $2', [userId, vehicleId]);
  return rows[0]?.quantity ?? null;
}

export async function setCartItem(userId, vehicleId, quantity) {
  await db.query(
    `INSERT INTO cart_items (user_id, vehicle_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, vehicle_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    [userId, vehicleId, quantity]
  );
}

export async function deleteCartItem(userId, vehicleId) {
  const { rows } = await db.query(
    'DELETE FROM cart_items WHERE user_id = $1 AND vehicle_id = $2 RETURNING vehicle_id',
    [userId, vehicleId]
  );
  return rows.length > 0;
}

export async function deleteCartItems(userId, tx = db) {
  await tx.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
}

export async function lockCartItems(userId, tx) {
  const { rows } = await tx.query(
    `SELECT cart_items.vehicle_id AS "vehicleId", cart_items.quantity, vehicles.quantity AS "availableQuantity",
            vehicles.make, vehicles.model, vehicles.year, vehicles.condition, vehicles.trim, vehicles.color,
            vehicles.mileage_km AS "mileageKm", vehicles.price
     FROM cart_items JOIN vehicles ON vehicles.id = cart_items.vehicle_id
     WHERE cart_items.user_id = $1
     ORDER BY cart_items.vehicle_id
     FOR UPDATE OF cart_items, vehicles`, // rows stay locked until the checkout transaction ends
    [userId]
  );
  return rows;
}
