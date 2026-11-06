import { db } from '../storage/db.js';
import { lockCartItems, deleteCartItems } from '../storage/cartStore.js';
import { createOrder, addOrderItem, getOrder } from '../storage/orderStore.js';
import { decreaseVehicleStock } from '../storage/vehicleStore.js';
import { authorizePayment } from './paymentService.js';

// Places an order for the user's whole cart. Everything runs in one transaction,
// so the order, the stock and the cart all change together or not at all.
// A denied payment is still saved as an order, but leaves the stock and the cart as they were.
// Returns { order }, or { problem } with the reason no order could be placed.
// TODO: collect and save the shipping information
export async function checkoutCart(userId) {
  return db.transaction(async (tx) => {
    const items = await lockCartItems(userId, tx);
    if (items.length === 0) return { problem: 'empty_cart' };

    const unavailable = items.find((item) => item.quantity > item.availableQuantity);
    if (unavailable) {
      return { problem: 'insufficient_stock', vehicleId: unavailable.vehicleId, available: unavailable.availableQuantity };
    }

    const status = authorizePayment() ? 'PROCESSED' : 'DENIED';
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = await createOrder(userId, status, total, tx);
    for (const item of items) {
      await addOrderItem(orderId, item, tx);
    }

    if (status === 'PROCESSED') {
      for (const item of items) {
        await decreaseVehicleStock(item.vehicleId, item.quantity, tx);
      }
      await deleteCartItems(userId, tx);
    }

    return { order: await getOrder(userId, orderId, tx) };
  });
}
