import { db } from '../storage/db.js';
import { lockCartItems, deleteCartItems } from '../storage/cartStore.js';
import { createOrder, addOrderItem, getOrder } from '../storage/orderStore.js';
import { decreaseVehicleStock } from '../storage/vehicleStore.js';
import { authorizePayment } from './paymentService.js';

export async function checkoutCart(userId, shipping, card) {
  return db.transaction(async (tx) => {
    const items = await lockCartItems(userId, tx);
    if (items.length === 0) return { problem: 'empty_cart' };

    const unavailable = items.find((item) => item.quantity > item.availableQuantity);
    if (unavailable) {
      return { problem: 'insufficient_stock', vehicleId: unavailable.vehicleId, available: unavailable.availableQuantity };
    }

    const status = authorizePayment(card) ? 'PROCESSED' : 'DENIED';
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = await createOrder(userId, status, total, shipping, tx);

    // denied orders are still saved, but leave the stock and cart alone
    for (const item of items) {
      await addOrderItem(orderId, item, tx);
      if (status === 'PROCESSED') await decreaseVehicleStock(item.vehicleId, item.quantity, tx);
    }
    if (status === 'PROCESSED') await deleteCartItems(userId, tx);

    return { order: await getOrder(userId, orderId, tx) };
  });
}
