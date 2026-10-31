# EV Inventory API

A small Express.js REST API for an electric-vehicle inventory. Data is stored in PostgreSQL using [PGlite](https://pglite.dev), which runs inside the Node process, so there is no database server to install.

## Requirements

- Node.js 20+ recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

The API runs at `http://localhost:3000`.

On first start the server creates the database in `db/pgdata`, runs `db/schema.sql` and loads the sample vehicles from `db/seed.sql`. Later starts reuse the same data.

To go back to the original sample data, stop the server and run:

```bash
npm run db:reset
```

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/vehicles` | List vehicles |
| GET | `/api/vehicles?make=Tesla` | Filter by make |
| GET | `/api/vehicles?condition=used&available=true` | Filter by condition and availability |
| GET | `/api/vehicles?year=2024&bodyType=suv` | Filter by model year and body type |
| GET | `/api/vehicles?hasAccidents=false` | Filter by accident history |
| GET | `/api/vehicles?sort=price&order=desc` | Sort by `price` or `mileageKm`, `asc` (default) or `desc` |
| GET | `/api/vehicles?search=model%203` | Search make/model/trim/year/description |
| GET | `/api/vehicles/:id` | Get one vehicle |
| POST | `/api/vehicles` | Add a vehicle |
| PATCH | `/api/vehicles/:id` | Update some fields on a vehicle |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |

Filters and sorting can be combined, e.g. `/api/vehicles?condition=used&hasAccidents=false&sort=mileageKm`.

## Example requests

List inventory:

```bash
curl http://localhost:3000/api/vehicles
```

Create a vehicle:

```bash
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"make":"Kia","model":"EV6","year":2025,"price":52000,"condition":"new","bodyType":"suv","rangeKm":480,"batteryKwh":84,"quantity":3}'
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

Required on create: `make`, `model`, `year`, `price` (whole dollars), `rangeKm`, `batteryKwh`.

Optional: `condition` (`new` or `used`, default `new`), `trim`, `color`, `bodyType` (e.g. `sedan`, `suv`, `hatchback`, `truck`), `mileageKm` (default `0`), `hasAccidents` (default `false`), `historyReport`, `quantity` (units in stock, default `1`), `description`, `imageUrl`.

Read-only: `id`, `createdAt`, `updatedAt`, and `available`, which is `true` when `quantity` is greater than 0 and cannot be set directly.

Fields not listed here are ignored.

## Notes

- The database schema is in `db/schema.sql` and the sample data in `db/seed.sql`. Both are plain PostgreSQL.
- All queries use parameters (`$1`, `$2`, …) rather than inserting request values into SQL text, which protects against SQL injection.
- Add authentication/authorization before exposing create, update, or delete endpoints publicly.
