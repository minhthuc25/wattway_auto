import { getVehicle } from '../storage/vehicleStore.js';
import {
  listTestDrives,
  listAllTestDrives,
  getTestDrive,
  createTestDrive,
  updateTestDriveStatus,
} from '../storage/testDriveStore.js';

// Customers see their own test drives; admins see everyone's.
export async function getTestDrivesFor(user) {
  return user.role === 'admin' ? listAllTestDrives() : listTestDrives(user.id);
}

// Returns { testDrive }, or { problem } with the reason it could not be booked.
export async function bookTestDrive(userId, { vehicleId, type, scheduledAt, address }) {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) return { problem: 'vehicle_not_found' };
  if (vehicle.quantity === 0) return { problem: 'vehicle_unavailable' };

  // A virtual test drive does not take place anywhere, so it has no address.
  const testDrive = await createTestDrive(userId, vehicleId, type, scheduledAt, type === 'at_home' ? address : null);
  if (!testDrive) return { problem: 'slot_taken' };
  return { testDrive };
}

// Only the customer who booked it, or an admin, can cancel a test drive.
// Returns { testDrive }, or { problem } with the reason it could not be cancelled.
export async function cancelTestDrive(user, id) {
  const testDrive = await getTestDrive(id);
  if (!testDrive || (testDrive.userId !== user.id && user.role !== 'admin')) return { problem: 'not_found' };
  if (testDrive.status === 'CANCELLED') return { problem: 'already_cancelled' };

  return { testDrive: await updateTestDriveStatus(id, 'CANCELLED') };
}
