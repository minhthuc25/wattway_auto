import { db } from './db.js';

const ORDER_FIELDS = 'id, status, total, created_at AS "createdAt"';

// Adds an order's items, with the vehicle details and prices saved when it was placed.
async function withItems(order, tx) {
  const { rows } = await tx.query(
    `SELECT vehicle_id AS "vehicleId", make, model, year, condition, trim, color, mileage_km AS "mileageKm",
            quantity, unit_price AS "unitPrice"
     FROM order_items WHERE order_id = $1 ORDER BY vehicle_id`,
    [order.id]
  );
  const items = rows.map(({ vehicleId, quantity, unitPrice, ...vehicle }) => ({
    vehicleId,
    vehicle,
    quantity,
    unitPrice,
    lineTotal: unitPrice * quantity,
  }));
  return { ...order, items };
}

// Returns the user's orders, newest first.
export async function listOrders(userId) {
  const { rows } = await db.query(`SELECT ${ORDER_FIELDS} FROM orders WHERE user_id = $1 ORDER BY id DESC`, [userId]);
  return Promise.all(rows.map((order) => withItems(order, db)));
}

// Returns an order only if it belongs to this user, otherwise null.
export async function getOrder(userId, orderId, tx = db) {
  const { rows } = await tx.query(`SELECT ${ORDER_FIELDS} FROM orders WHERE user_id = $1 AND id = $2`, [userId, orderId]);
  return rows[0] ? withItems(rows[0], tx) : null;
}

// Returns whether the user has a successfully paid order that includes this vehicle.
export async function hasPurchasedVehicle(userId, vehicleId) {
  const { rows } = await db.query(
    `SELECT EXISTS (
       SELECT 1 FROM orders JOIN order_items ON order_items.order_id = orders.id
       WHERE orders.user_id = $1 AND order_items.vehicle_id = $2 AND orders.status = 'PROCESSED'
     ) AS purchased`,
    [userId, vehicleId]
  );
  return rows[0].purchased;
}

// createOrder and addOrderItem run inside the checkout transaction, so they take its connection.
export async function createOrder(userId, status, total, tx) {
  const { rows } = await tx.query(
    'INSERT INTO orders (user_id, status, total) VALUES ($1, $2, $3) RETURNING id',
    [userId, status, total]
  );
  return rows[0].id;
}

export async function addOrderItem(orderId, item, tx) {
  await tx.query(
    `INSERT INTO order_items (order_id, vehicle_id, make, model, year, condition, trim, color, mileage_km, quantity, unit_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [orderId, item.vehicleId, item.make, item.model, item.year, item.condition, item.trim, item.color, item.mileageKm, item.quantity, item.price]
  );
}
