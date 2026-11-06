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

On first start the server creates the database in `db/pgdata`. Later starts reuse the same data and add any new tables.

To go back to the original sample data, or after a change to an existing table, stop the server and run:

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
| GET | `/api/cart` | Logged in | Get your cart |
| POST | `/api/cart/items` | Logged in | Add a vehicle to your cart |
| PATCH | `/api/cart/items/:vehicleId` | Logged in | Change the quantity of a vehicle in your cart |
| DELETE | `/api/cart/items/:vehicleId` | Logged in | Remove a vehicle from your cart |
| DELETE | `/api/cart` | Logged in | Empty your cart |
| POST | `/api/orders` | Logged in | Check out: place an order for everything in your cart |
| GET | `/api/orders` | Logged in | List your orders, newest first |
| GET | `/api/orders/:id` | Logged in | Get one of your orders |
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

### Parameters for Shopping Cart

Each user has their own cart. A vehicle in a cart does not reserve stock.

| Parameter | Values |
|---|---|
| `vehicleId` | ID of the vehicle, required when adding |
| `quantity` | A whole number of at least 1. When adding, it is added to any quantity already in the cart (default `1`). When changing, it replaces the quantity and is required |

Returns `items`, `itemCount` and `total`. A quantity above the available stock returns `409`.

### Checkout

`POST /api/orders` takes no parameters. The payment system is a mock: every third request is denied, counting from when the server started.

| Result | Status | Outcome |
|---|---|---|
| Payment approved | `201`, "Order Successfully Completed" | Order saved as `PROCESSED`, stock reduced, cart emptied |
| Payment denied | `402`, "Credit Card Authorization Failed" | Order saved as `DENIED`, stock and cart unchanged |
| Empty cart or too little stock | `409` | Nothing |

## Authentication

Logging in returns a session token found in `data.token`. Send it on every request that needs a login:

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

Add a vehicle to your cart:

```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":2,"quantity":1}'
```

Get your cart:

```bash
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN"
```

Change the quantity of a vehicle in your cart:

```bash
curl -X PATCH http://localhost:3000/api/cart/items/2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":2}'
```

Check out:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

List your orders:

```bash
curl http://localhost:3000/api/orders \
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
