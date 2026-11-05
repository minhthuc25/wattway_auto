import { db } from './db.js';

const CART_ITEMS_QUERY = `
  SELECT ci.vehicle_id AS "vehicleId",
         ci.quantity,
         v.price * ci.quantity AS "lineTotal",
         jsonb_build_object(
           'id', v.id,
           'make', v.make,
           'model', v.model,
           'year', v.year,
           'price', v.price,
           'condition', v.condition,
           'trim', v.trim,
           'color', v.color,
           'bodyType', v.body_type,
           'rangeKm', v.range_km,
           'batteryKwh', v.battery_kwh,
           'mileageKm', v.mileage_km,
           'hasAccidents', v.has_accidents,
           'historyReport', v.history_report,
           'quantity', v.quantity,
           'available', v.quantity > 0,
           'description', v.description,
           'imageUrl', v.image_url,
           'createdAt', v.created_at,
           'updatedAt', v.updated_at
         ) AS vehicle
  FROM cart_items ci
  JOIN vehicles v ON v.id = ci.vehicle_id
`;

export async function getCart(userId) {
  const { rows } = await db.query(
    `${CART_ITEMS_QUERY} WHERE ci.user_id = $1 ORDER BY ci.vehicle_id`,
    [userId]
  );
  return {
    items: rows,
    itemCount: rows.reduce((count, item) => count + item.quantity, 0),
    total: rows.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

export async function addCartItem(userId, vehicleId, quantity) {
  const { rows } = await db.query(
    `INSERT INTO cart_items (user_id, vehicle_id, quantity)
     SELECT $1, v.id, $3 FROM vehicles v
     WHERE v.id = $2 AND v.quantity >= $3
     ON CONFLICT (user_id, vehicle_id) DO UPDATE
       SET quantity = cart_items.quantity + EXCLUDED.quantity
       WHERE EXISTS (
         SELECT 1 FROM vehicles v
         WHERE v.id = EXCLUDED.vehicle_id
           AND v.quantity >= cart_items.quantity + EXCLUDED.quantity
       )
     RETURNING vehicle_id`,
    [userId, vehicleId, quantity]
  );
  if (rows.length) return 'added';

  const { rows: vehicles } = await db.query('SELECT id FROM vehicles WHERE id = $1', [vehicleId]);
  return vehicles.length ? 'insufficient_stock' : 'vehicle_not_found';
}

export async function setCartItemQuantity(userId, vehicleId, quantity) {
  const { rows } = await db.query(
    `UPDATE cart_items ci SET quantity = $3
     WHERE ci.user_id = $1 AND ci.vehicle_id = $2
       AND EXISTS (
         SELECT 1 FROM vehicles v
         WHERE v.id = ci.vehicle_id AND v.quantity >= $3
       )
     RETURNING ci.vehicle_id`,
    [userId, vehicleId, quantity]
  );
  if (rows.length) return 'updated';

  const { rows: items } = await db.query(
    'SELECT vehicle_id FROM cart_items WHERE user_id = $1 AND vehicle_id = $2',
    [userId, vehicleId]
  );
  return items.length ? 'insufficient_stock' : 'item_not_found';
}

export async function removeCartItem(userId, vehicleId) {
  const { rows } = await db.query(
    'DELETE FROM cart_items WHERE user_id = $1 AND vehicle_id = $2 RETURNING vehicle_id',
    [userId, vehicleId]
  );
  return rows.length > 0;
}

export async function clearCart(userId) {
  await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
}
