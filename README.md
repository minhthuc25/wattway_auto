# York University - EECS 4413 - Group G - WattWay Auto API

The back end of WattWay Auto, an online store for new and used electric vehicles. It is an Express.js REST API. Data is stored using PostgreSQL in an embedded PGlite database or a hosted database.

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

## Environment variables

All are optional (the API runs locally without any of them).

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Connection string of a hosted PostgreSQL database, e.g. Neon | Uses local database in `db/pgdata` |
| `GEMINI_API_KEY` | Google AI Studio key for the chatbot | The chatbot returns `503` while everything else works |
| `PORT` | Port the server listens on | `3000` |

To set them before starting the server:

```bash
GEMINI_API_KEY='<your key>'
```

## Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/users` | Public | Register a customer account |
| GET | `/api/users/me` | Logged in | Get your own account |
| PATCH | `/api/users/me` | Logged in | Change your default shipping address |
| POST | `/api/sessions` | Public | Log in; returns a session token |
| DELETE | `/api/sessions/current` | Logged in | Log out |
| GET | `/api/vehicles?param=value` | Public | List vehicles, optionally filtered and sorted |
| GET | `/api/vehicles/:id` | Public | Get one vehicle |
| POST | `/api/vehicles` | Admin | Add a vehicle |
| PATCH | `/api/vehicles/:id` | Admin | Update some fields on a vehicle |
| DELETE | `/api/vehicles/:id` | Admin | Delete a vehicle |
| GET | `/api/vehicles/:id/savings?kmPerYear=value` | Public | Yearly cost and CO2 savings compared with a gas car |
| GET | `/api/vehicles/:id/reviews` | Public | Get a vehicle's reviews and average ratings |
| POST | `/api/vehicles/:id/reviews` | Verified owner | Review a vehicle you have purchased |
| GET | `/api/cart` | Logged in | Get your cart |
| POST | `/api/cart/items` | Logged in | Add a vehicle to your cart |
| PATCH | `/api/cart/items/:vehicleId` | Logged in | Change the quantity of a vehicle in your cart |
| DELETE | `/api/cart/items/:vehicleId` | Logged in | Remove a vehicle from your cart |
| DELETE | `/api/cart` | Logged in | Empty your cart |
| POST | `/api/orders` | Logged in | Check out: place an order for everything in your cart |
| GET | `/api/orders` | Logged in | List your orders, newest first |
| GET | `/api/orders/:id` | Logged in | Get one of your orders |
| POST | `/api/test-drives` | Logged in | Book a test drive |
| GET | `/api/test-drives` | Logged in | List your test drives, soonest first (admins see all) |
| PATCH | `/api/test-drives/:id` | Logged in | Cancel your test drive (admins can cancel any) |
| GET | `/api/loan?price=&downPayment=&rate=&months=` | Public | Monthly payment estimate for a loan |
| POST | `/api/chat` | Public | Ask the chatbot a question |
| GET | `/api/analytics/sales?year=value` | Admin | Vehicles sold each month of a year |
| GET | `/api/analytics/usage` | Admin | Views, cart additions and purchases per vehicle |

### Parameters for User Accounts

Registering takes `username`, `password` (at least 8 characters), `firstName` and `lastName`, plus an optional `defaultShipping` address. The address can pre-fill checkout, but each order keeps its own copy. `PATCH /api/users/me` takes `defaultShipping` and requires it.

| Parameter | Values |
|---|---|
| `defaultShipping.street`, `defaultShipping.city`, `defaultShipping.province`, `defaultShipping.country`, `defaultShipping.postalCode` | Text, all required if an address is given |

Accounts without an address return `defaultShipping` as `null`.

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
| `bodyType` | `sedan`, `suv`, `hatchback`, `truck` | Body type, not case-sensitive |
| `hasAccidents` | `true`, `false` | With or without reported accidents |
| `sort` | `price`, `mileageKm` | Sort by this field |
| `order` | `asc`, `desc` | Sort direction |

### Parameters for Vehicles

Adding a vehicle requires `make`, `model`, `year`, `price`, `bodyType`, `rangeKm` and `batteryKwh`. Updating changes only the fields given. Other fields are ignored, and `available` comes from `quantity`, so it cannot be set.

| Parameter | Values |
|---|---|
| `make`, `model` | Text |
| `year` | Model year |
| `price` | Whole dollars |
| `rangeKm` | Range in km, a whole number |
| `batteryKwh` | Battery capacity in kWh |
| `condition` | `new` or `used` (default `new`) |
| `bodyType` | `sedan`, `suv`, `hatchback` or `truck` |
| `mileageKm` | Whole km (default `0`) |
| `hasAccidents` | `true` or `false` (default `false`) |
| `quantity` | Units in stock (default `1`) |
| `trim`, `color`, `historyReport`, `description`, `imageUrl` | Text |

### Parameters for Savings Calculator

Compares driving the vehicle with driving a gas car the same distance.

| Parameter | Values | Default |
|---|---|---|
| `kmPerYear` | Distance driven per year, required | — |
| `gasCarLPer100Km` | Fuel use of the gas car being compared | `8.5` |
| `gasPricePerL` | Dollars per litre of gas | `1.55` |
| `electricityPricePerKwh` | Dollars per kWh for charging | `0.13` |

Returns the yearly energy cost, fuel cost, cost savings and CO2 (kg) for both.

### Parameters for Reviews

A verified owner is someone with a `PROCESSED` order that includes the vehicle. Anyone else gets `403`. Each user can review a vehicle once; a second review gets `409`.

| Parameter | Values |
|---|---|
| `rating` | Stars, a whole number from 1 to 5, required |
| `comment` | Optional text |

`GET` returns `reviews`, `reviewCount` and `averageRating`.

### Parameters for Shopping Cart

Each user has their own cart. A vehicle in a cart does not reserve stock.

| Parameter | Values |
|---|---|
| `vehicleId` | ID of the vehicle, required when adding |
| `quantity` | A whole number of at least 1. When adding, it is added to any quantity already in the cart (default `1`). When changing, it replaces the quantity and is required |

Returns `items`, `itemCount` and `total`. A quantity above the available stock returns `409`.

### Parameters for Checkout

`POST /api/orders` needs a `shipping` object and a `card` object, all fields required. The shipping address is saved on the order; the card is never stored.

| Parameter | Values |
|---|---|
| `shipping.street`, `shipping.city`, `shipping.province`, `shipping.country`, `shipping.postalCode` | Text |
| `card.number` | 13 to 19 digits, no spaces |
| `card.expiry` | `MM/YY`, not expired |
| `card.cvv` | 3 or 4 digits |

The payment system is a mock: every third request is denied, counting from when the server started.

| Result | Status | Outcome |
|---|---|---|
| Payment approved | `201`, "Order Successfully Completed" | Order saved as `PROCESSED`, stock reduced, cart emptied |
| Payment denied | `402`, "Credit Card Authorization Failed" | Order saved as `DENIED`, stock and cart unchanged |
| Empty cart or too little stock | `409` | Nothing |

### Parameters for Test Drives

Test drives are booked in one-hour slots, and each vehicle can have one test drive per slot. A taken slot or a sold-out vehicle returns `409`. Cancelling frees the slot.

| Parameter | Values |
|---|---|
| `vehicleId` | ID of the vehicle, required |
| `type` | `at_home` or `virtual`, required |
| `scheduledAt` | A future date and time on the hour, with a time zone, e.g. `2026-12-01T15:00:00-05:00`, required |
| `address` | The customer's address, required when `type` is `at_home`; a virtual test drive has none |

To cancel, send `PATCH` with `{ "status": "CANCELLED" }`.

### Parameters for Loan Calculator

All four are required, e.g. `/api/loan?price=80000&downPayment=20000&rate=6&months=60`.

| Parameter | Values |
|---|---|
| `price` | Vehicle price in dollars, greater than 0 |
| `downPayment` | Dollars, at least 0 and less than `price` |
| `rate` | Yearly interest rate in percent, (e.g. `6` for 6%) |
| `months` | Loan duration, a whole number from 1 to 120 |

Returns `loanAmount`, `monthlyPayment` and `totalInterest`.

### Parameters for Chatbot

The chatbot knows the current inventory and links to vehicles as `/vehicles/:id`. Each message is answered on its own.

| Parameter | Values |
|---|---|
| `message` | The question, at most 500 characters, required |

The reply is in `data.reply`. If the chatbot can't be reached, the response is `502`.

### Parameters for Analytics Reports

Viewing a vehicle records a `VIEW`, adding it to a cart records a `CART`, and buying it records a `PURCHASE`.

| Parameter | Values |
|---|---|
| `year` | Year of the sales report, e.g. `2026`, required |

The sales report returns the `quantity` sold and `revenue` for each vehicle by `month`. Denied orders are not counted.

The usage report returns the `views`, `cartAdds`, `purchases` and `visitors` (different IP addresses) for each vehicle.

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

List used vehicles without accidents, lowest mileage first:

```bash
curl "http://localhost:3000/api/vehicles?condition=used&hasAccidents=false&sort=mileageKm"
```

Add a vehicle to your cart:

```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":2,"quantity":1}'
```

Check out:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shipping":{"street":"123 Example St","city":"Toronto","province":"ON","country":"Canada","postalCode":"A1B 2C3"},"card":{"number":"4111111111111111","expiry":"12/30","cvv":"123"}}'
```

## Notes

- The database schema is in `db/schema.sql` and the sample data in `db/seed.sql`.
- All queries use parameters (`$1`, `$2`, …) rather than inserting request values into SQL text, which protects against SQL injection.
- Passwords are stored as salted scrypt hashes, and session tokens as SHA-256 hashes.
