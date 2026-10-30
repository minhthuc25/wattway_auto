# EV Inventory API

A small Express.js REST API starter for an electric-vehicle inventory. Data is stored in `data/vehicles.json`, so you can develop without setting up a database.

## Requirements

- Node.js 20+ recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

The API runs at `http://localhost:3000`.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/vehicles` | List vehicles |
| GET | `/api/vehicles?make=Tesla` | Filter by make |
| GET | `/api/vehicles?condition=used&available=true` | Filter by condition and availability |
| GET | `/api/vehicles?search=model%203` | Search make/model/trim/year/description |
| GET | `/api/vehicles/:id` | Get one vehicle |
| POST | `/api/vehicles` | Add a vehicle |
| PATCH | `/api/vehicles/:id` | Update some fields on a vehicle |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |

## Example requests

List inventory:

```bash
curl http://localhost:3000/api/vehicles
```

Create a vehicle:

```bash
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"make":"Kia","model":"EV6","year":2025,"price":52000,"condition":"new","rangeKm":480,"batteryKwh":84,"quantity":3}'
```

Update a vehicle (replace `1` with an actual ID):

```bash
curl -X PATCH http://localhost:3000/api/vehicles/1 \
  -H "Content-Type: application/json" \
  -d '{"price":46990,"quantity":0}'
```

Delete a vehicle:

```bash
curl -X DELETE http://localhost:3000/api/vehicles/1
```

## Vehicle fields

Required on create: `make`, `model`, `year`, `price`.

Optional: `condition` (`new` or `used`), `trim`, `color`, `rangeKm`, `batteryKwh`, `quantity` (units in stock, default `1`), `description`, `imageUrl`.

Read-only: `available` is included in every response and is `true` when `quantity` is greater than 0. It cannot be set directly.

## Notes

- The JSON file is read and rewritten for each request that changes data.
- This is suitable for a school project or local prototype. It is not safe for multi-instance or high-concurrency production use; simultaneous writes can overwrite one another. Move to a database such as PostgreSQL when the project grows.
- Add authentication/authorization before exposing create, update, or delete endpoints publicly.
