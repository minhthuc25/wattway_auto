import { getVehicle } from '../storage/vehicleStore.js';
import {
  listTestDrives,
  listAllTestDrives,
  getTestDrive,
  createTestDrive,
  updateTestDriveStatus,
} from '../storage/testDriveStore.js';

export async function getTestDrivesFor(user) {
  return user.role === 'admin' ? listAllTestDrives() : listTestDrives(user.id);
}

export async function bookTestDrive(userId, { vehicleId, type, scheduledAt, address }) {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) return { problem: 'vehicle_not_found' };
  if (vehicle.quantity === 0) return { problem: 'vehicle_unavailable' };

  const testDrive = await createTestDrive(userId, vehicleId, type, scheduledAt, type === 'at_home' ? address : null); // virtual drives have no address
  if (!testDrive) return { problem: 'slot_taken' };
  return { testDrive };
}

export async function cancelTestDrive(user, id) {
  const testDrive = await getTestDrive(id);
  if (!testDrive || (testDrive.userId !== user.id && user.role !== 'admin')) return { problem: 'not_found' }; // 404, not 403, so other bookings stay hidden
  if (testDrive.status === 'CANCELLED') return { problem: 'already_cancelled' };

  return { testDrive: await updateTestDriveStatus(id, 'CANCELLED') };
}
