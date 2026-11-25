import { db } from './db.js';

export async function recordVisitEvent(ipAddress, vehicleId, eventType) {
  await db.query('INSERT INTO visit_events (ip_address, vehicle_id, event_type) VALUES ($1, $2, $3)', [ipAddress, vehicleId, eventType]);
}

export async function getUsageReport() {
  const { rows } = await db.query(
    `SELECT vehicles.id AS "vehicleId", make, model, year,
            COUNT(*) FILTER (WHERE event_type = 'VIEW')::int AS views,
            COUNT(*) FILTER (WHERE event_type = 'CART')::int AS "cartAdds",
            COUNT(*) FILTER (WHERE event_type = 'PURCHASE')::int AS purchases,
            COUNT(DISTINCT ip_address)::int AS visitors
     FROM visit_events JOIN vehicles ON vehicles.id = visit_events.vehicle_id
     GROUP BY vehicles.id ORDER BY views DESC, vehicles.id`
  );
  return rows;
}
