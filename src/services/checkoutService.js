import { db } from '../storage/db.js';

export async function checkoutCart(userId) {
  try {
    return await db.transaction(async (tx) => {
      const { rows: items } = await tx.query(
        `SELECT ci.vehicle_id AS "vehicleId", ci.quantity, v.quantity AS "availableQuantity",
                v.make, v.model, v.year, v.condition, v.trim, v.color, v.price
         FROM cart_items ci
         JOIN vehicles v ON v.id = ci.vehicle_id
         WHERE ci.user_id = $1
         ORDER BY ci.vehicle_id
         FOR UPDATE OF ci, v`,
        [userId]
      );

      if (!items.length) return { status: 'empty_cart' };

      const unavailable = items.find((item) => item.quantity > item.availableQuantity);
      if (unavailable) {
        return {
          status: 'insufficient_stock',
          vehicleId: unavailable.vehicleId,
          available: unavailable.availableQuantity,
        };
      }

      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (!Number.isSafeInteger(total)) {
        throw new RangeError('Order total exceeds the supported amount');
      }

      const { rows: [order] } = await tx.query(
        `INSERT INTO orders (user_id, total)
         VALUES ($1, $2)
         RETURNING id, status, total, created_at AS "createdAt"`,
        [userId, total]
      );

      for (const item of items) {
        const { rows: updatedVehicles } = await tx.query(
          `UPDATE vehicles
           SET quantity = quantity - $2, updated_at = now()
           WHERE id = $1 AND quantity >= $2
           RETURNING id`,
          [item.vehicleId, item.quantity]
        );
        if (!updatedVehicles.length) {
          throw new StockChangedError({
            status: 'insufficient_stock',
            vehicleId: item.vehicleId,
            available: item.availableQuantity,
          });
        }

        await tx.query(
          `INSERT INTO order_items
             (order_id, vehicle_id, make, model, year, condition, trim, color, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            order.id,
            item.vehicleId,
            item.make,
            item.model,
            item.year,
            item.condition,
            item.trim,
            item.color,
            item.quantity,
            item.price,
            item.price * item.quantity,
          ]
        );
      }

      await tx.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      return {
        status: 'placed',
        order: {
          id: order.id,
          status: order.status,
          total: Number(order.total),
          createdAt: order.createdAt,
          items: items.map((item) => ({
            vehicleId: item.vehicleId,
            vehicle: {
              make: item.make,
              model: item.model,
              year: item.year,
              condition: item.condition,
              trim: item.trim,
              color: item.color,
            },
            quantity: item.quantity,
            unitPrice: item.price,
            lineTotal: item.price * item.quantity,
          })),
        },
      };
    });
  } catch (err) {
    if (err instanceof StockChangedError) return err.result;
    throw err;
  }
}

class StockChangedError extends Error {
  constructor(result) {
    super('Vehicle stock changed during checkout');
    this.result = result;
  }
}
