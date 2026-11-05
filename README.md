# York University - EECS 4413 - Group G - Inventory API

A small Express.js REST API for an electric-vehicle inventory. Data is stored in PostgreSQL using PGlite.

## Requirements

- Node.js (20+ recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

The API runs at `http://localhost:3000`.

On first start the server creates and seeds the database in `db/pgdata`. Later starts reuse the data and apply any new tables from `db/schema.sql`.

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
| GET | `/api/vehicles?param=value` | Public | List vehicles, optionally filtered and sorted |
| GET | `/api/vehicles/:id` | Public | Get one vehicle |
| GET | `/api/vehicles/:id/savings?kmPerYear=value` | Public | Yearly cost and CO2 savings compared with a gas car |
| GET | `/api/loan?price=&downPayment=&rate=&months=` | Public | Monthly payment estimate for a loan |
| GET | `/api/cart` | Logged in | View your shopping cart |
| POST | `/api/cart/items` | Logged in | Add a vehicle and quantity to your cart |
| PATCH | `/api/cart/items/:vehicleId` | Logged in | Set the quantity of a cart item |
| DELETE | `/api/cart/items/:vehicleId` | Logged in | Remove a vehicle from your cart |
| DELETE | `/api/cart` | Logged in | Clear your cart |
| POST | `/api/checkout` | Logged in | Place an order from your cart |
| POST | `/api/vehicles` | Admin | Add a vehicle |
| PATCH | `/api/vehicles/:id` | Admin | Update some fields on a vehicle |
| DELETE | `/api/vehicles/:id` | Admin | Delete a vehicle |

### Parameters for Vehicle Listing

All parameters are optional and can be combined, e.g. `/api/vehicles?condition=used&hasAccidents=false&sort=mileageKm`.

| Parameter | Values | Matches |
|---|---|---|
| `search` | any text | Text found anywhere in make, model, trim, year or description, e.g. `search=model%203` |
| `make` | e.g. `Tesla` | Exact make, not case-sensitive |
| `model` | e.g. `Model` | Model containing the text, not case-sensitive |
| `condition` | `new`, `used` | Condition |
| `available` | `true`, `false` | In stock (`quantity` > 0) or not |
| `year` | e.g. `2024` | Exact model year |
| `bodyType` | e.g. `suv`, `sedan` | Exact body type, not case-sensitive |
| `hasAccidents` | `true`, `false` | With or without reported accidents |
| `sort` | `price`, `mileageKm` | Sort by this field |
| `order` | `asc`, `desc` | Sort direction |

### Parameters for Savings Calculator

Compares driving the vehicle with driving a gas car the same distance.

| Parameter | Values | Default |
|---|---|---|
| `kmPerYear` | Distance driven per year, required | — |
| `gasCarLPer100Km` | Fuel use of the gas car being compared | `8.5` |
| `gasPricePerL` | Dollars per litre of gas | `1.55` |
| `electricityPricePerKwh` | Dollars per kWh for charging | `0.13` |

Returns the yearly energy cost, fuel cost, cost savings and CO2 (kg) for both.

### Parameters for Loan Calculator

All four are required, e.g. `/api/loan?price=80000&downPayment=20000&rate=6&months=60`.

| Parameter | Values |
|---|---|
| `price` | Vehicle price in dollars, greater than 0 |
| `downPayment` | Dollars, at least 0 and less than `price` |
| `rate` | Yearly interest rate in percent, (e.g. `6` for 6%) |
| `months` | Loan duration, a whole number from 1 to 120 |

Returns `loanAmount`, `monthlyPayment` and `totalInterest`.

### Shopping Cart

Cart items are saved separately for each logged-in user. Adding a vehicle increments its existing cart quantity; available inventory is checked when adding or changing quantities, but cart items do not reserve stock. All cart routes require login.

Add a vehicle (quantity defaults to `1`):

```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":1,"quantity":1}'
```

The cart endpoints return `{ "data": { "items": [...], "itemCount": 1, "total": 48990 } }` for reads and successful item changes. Each item includes its `vehicle`, `vehicleId`, `quantity`, and `lineTotal`. Clearing the cart returns `204` with no response body. Invalid IDs or quantities return `400`; a vehicle or cart item that does not exist returns `404`; adding or setting a quantity above current stock returns `409`.

Get the cart:

```bash
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN"
```

Set a cart item's quantity, remove an item, or clear the cart:

```bash
curl -X PATCH http://localhost:3000/api/cart/items/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":2}'

curl -X DELETE http://localhost:3000/api/cart/items/1 \
  -H "Authorization: Bearer $TOKEN"

curl -X DELETE http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN"
```

### Checkout

`POST /api/checkout` places an order using the logged-in user's entire cart. No request body is required:

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer $TOKEN"
```

On success, it returns `201` with `{ "data": { "id": 1, "status": "placed", "total": 48990, "createdAt": "...", "items": [...] } }`. Each order item records the vehicle ID, vehicle details at purchase, quantity, unit price, and line total. The endpoint checks inventory, saves the order, decrements stock, and clears the cart in one database transaction. An empty cart or insufficient current stock returns `409`; if stock is insufficient, the response includes the affected `vehicleId` and available quantity. Failed checkout leaves the cart and inventory unchanged. Checkout requires login and records an order; it does not process payment.

## Authentication

Logging in returns a session token in the request header. Send it on every request that needs a login:

Use the token returned in `data.token` as a Bearer token in the `Authorization` header.

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
