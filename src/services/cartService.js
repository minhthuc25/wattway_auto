import { getVehicle } from '../storage/vehicleStore.js';
import { listCartItems, getCartItemQuantity, setCartItem } from '../storage/cartStore.js';

// Returns the cart's items with their vehicle details, plus the totals.
export async function getCart(userId) {
  const cartItems = await listCartItems(userId);
  const items = await Promise.all(
    cartItems.map(async ({ vehicleId, quantity }) => {
      const vehicle = await getVehicle(vehicleId);
      return { vehicleId, quantity, lineTotal: vehicle.price * quantity, vehicle };
    })
  );

  return {
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

// Adds to the quantity already in the cart. Returns null, or the reason it could not be done.
export async function addCartItem(userId, vehicleId, quantity) {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) return 'vehicle_not_found';

  const newQuantity = ((await getCartItemQuantity(userId, vehicleId)) ?? 0) + quantity;
  if (newQuantity > vehicle.quantity) return 'insufficient_stock';

  await setCartItem(userId, vehicleId, newQuantity);
  return null;
}

// Replaces the quantity of a vehicle in the cart. Returns null, or the reason it could not be done.
export async function changeCartItemQuantity(userId, vehicleId, quantity) {
  const current = await getCartItemQuantity(userId, vehicleId);
  if (current === null) return 'item_not_found';

  const vehicle = await getVehicle(vehicleId);
  if (quantity > vehicle.quantity) return 'insufficient_stock';

  await setCartItem(userId, vehicleId, quantity);
  return null;
}
