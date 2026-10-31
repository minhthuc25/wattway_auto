# EV Inventory API

A small Express.js REST API for an electric-vehicle inventory. Data is stored in PostgreSQL using [PGlite](https://pglite.dev), which runs inside the Node process, so there is no database server to install.

## Requirements

- Node.js (20+ recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

The API runs at `http://localhost:3000`.

On first start the server creates the database in `db/pgdata`. Later starts reuse the same data.

To go back to the original sample data, stop the server and run:

```bash
npm run db:reset
```

## Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/users` | Public | Register a customer account |
| GET | `/api/users/me` | Logged in | Get your own account |
| POST | `/api/sessions` | Public | Log in; returns a session token |
| DELETE | `/api/sessions/current` | Logged in | Log out |
| GET | `/api/vehicles` | Public | List vehicles |
| GET | `/api/vehicles?make=Tesla` | Public | Filter by make |
| GET | `/api/vehicles?condition=used&available=true` | Public | Filter by condition and availability |
| GET | `/api/vehicles?year=2024&bodyType=suv` | Public | Filter by model year and body type |
| GET | `/api/vehicles?hasAccidents=false` | Public | Filter by accident history |
| GET | `/api/vehicles?sort=price&order=desc` | Public | Sort by `price` or `mileageKm`, `asc` (default) or `desc` |
| GET | `/api/vehicles?search=model%203` | Public | Search make/model/trim/year/description |
| GET | `/api/vehicles/:id` | Public | Get one vehicle |
| POST | `/api/vehicles` | Admin | Add a vehicle |
| PATCH | `/api/vehicles/:id` | Admin | Update some fields on a vehicle |
| DELETE | `/api/vehicles/:id` | Admin | Delete a vehicle |

Filters and sorting can be combined, e.g. `/api/vehicles?condition=used&hasAccidents=false&sort=mileageKm`.

## Authentication

Logging in returns a session token in the request header. Send it on every request that needs a login:

```
Authorization: Bearer <token>
```

Tokens expire after 24 hours or when you log out.

The sample data includes one admin account for testing:

| Username | Password |
|---|---|
| `admin` | `admin` |

New registrations are always customer accounts.

## Example requests

List inventory:

```bash
curl http://localhost:3000/api/vehicles
```

Register:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"jsmith","password":"correct-horse","firstName":"John","lastName":"Smith"}'
```

Log in as the admin (the response contains `data.token`):

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

Save the token for the requests below:

```bash
TOKEN=paste-the-token-here
```

Create a vehicle:

```bash
curl -X POST http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"make":"Kia","model":"EV6","year":2025,"price":52000,"condition":"new","bodyType":"suv","rangeKm":480,"batteryKwh":84,"quantity":3}'
```

Update a vehicle (replace `1` with an actual ID):

```bash
curl -X PATCH http://localhost:3000/api/vehicles/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":46990,"quantity":0}'
```

Delete a vehicle:

```bash
curl -X DELETE http://localhost:3000/api/vehicles/1 \
  -H "Authorization: Bearer $TOKEN"
```

Log out:

```bash
curl -X DELETE http://localhost:3000/api/sessions/current \
  -H "Authorization: Bearer $TOKEN"
```

## Vehicle fields

Required on create: `make`, `model`, `year`, `price` (whole dollars), `rangeKm`, `batteryKwh`.

Optional: `condition` (`new` or `used`, default `new`), `trim`, `color`, `bodyType` (e.g. `sedan`, `suv`, `hatchback`, `truck`), `mileageKm` (default `0`), `hasAccidents` (default `false`), `historyReport`, `quantity` (units in stock, default `1`), `description`, `imageUrl`.

Fields not listed here are ignored.

## Notes

- The database schema is in `db/schema.sql` and the sample data in `db/seed.sql`.
- All queries use parameters (`$1`, `$2`, …) rather than inserting request values into SQL text, which protects against SQL injection.
- Passwords are stored as salted scrypt hashes, and session tokens as SHA-256 hashes.
- Run the server behind HTTPS when it is deployed, so passwords and tokens are not sent in plain text.
