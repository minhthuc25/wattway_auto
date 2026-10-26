import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '../../data/vehicles.json');

async function readVehicles() {
  const raw = await readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeVehicles(vehicles) {
  // This starter is intended for local development, not concurrent production writes.
  await writeFile(DATA_FILE, `${JSON.stringify(vehicles, null, 2)}\n`, 'utf8');
}

export async function listVehicles() {
  return readVehicles();
}

export async function getVehicle(id) {
  const vehicles = await readVehicles();
  return vehicles.find((vehicle) => vehicle.id === id) ?? null;
}

export async function createVehicle(input) {
  const vehicles = await readVehicles();
  const now = new Date().toISOString();
  const vehicle = {
    id: randomUUID(),
    make: String(input.make).trim(),
    model: String(input.model).trim(),
    year: Number(input.year),
    price: Number(input.price),
    condition: input.condition ?? 'new',
    trim: input.trim ?? '',
    color: input.color ?? '',
    rangeKm: input.rangeKm === undefined ? null : Number(input.rangeKm),
    batteryKwh: input.batteryKwh === undefined ? null : Number(input.batteryKwh),
    available: input.available ?? true,
    description: input.description ?? '',
    imageUrl: input.imageUrl ?? '',
    createdAt: now,
    updatedAt: now,
  };
  vehicles.push(vehicle);
  await writeVehicles(vehicles);
  return vehicle;
}

export async function updateVehicle(id, input) {
  const vehicles = await readVehicles();
  const index = vehicles.findIndex((vehicle) => vehicle.id === id);
  if (index === -1) return null;

  const current = vehicles[index];
  const updated = { ...current, ...input, id: current.id, updatedAt: new Date().toISOString() };
  for (const field of ['year', 'price', 'rangeKm', 'batteryKwh']) {
    if (updated[field] !== null && updated[field] !== undefined) updated[field] = Number(updated[field]);
  }
  if (updated.make !== undefined) updated.make = String(updated.make).trim();
  if (updated.model !== undefined) updated.model = String(updated.model).trim();

  vehicles[index] = updated;
  await writeVehicles(vehicles);
  return updated;
}

export async function deleteVehicle(id) {
  const vehicles = await readVehicles();
  const index = vehicles.findIndex((vehicle) => vehicle.id === id);
  if (index === -1) return false;
  vehicles.splice(index, 1);
  await writeVehicles(vehicles);
  return true;
}
