CREATE TABLE IF NOT EXISTS vehicles (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  make           TEXT    NOT NULL,
  model          TEXT    NOT NULL,
  year           INTEGER NOT NULL CHECK (year >= 1886),
  price          INTEGER NOT NULL CHECK (price >= 0),
  condition      TEXT    NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used')),
  trim           TEXT    NOT NULL DEFAULT '',
  color          TEXT    NOT NULL DEFAULT '',
  body_type      TEXT    NOT NULL DEFAULT '',
  range_km       INTEGER NOT NULL CHECK (range_km > 0),
  battery_kwh    REAL    NOT NULL CHECK (battery_kwh > 0),
  mileage_km     INTEGER NOT NULL DEFAULT 0 CHECK (mileage_km >= 0),
  has_accidents  BOOLEAN NOT NULL DEFAULT FALSE,
  history_report TEXT    NOT NULL DEFAULT '',
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  description    TEXT    NOT NULL DEFAULT '',
  image_url      TEXT    NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username             TEXT NOT NULL UNIQUE, -- stored in lowercase
  password_hash        TEXT NOT NULL,
  first_name           TEXT NOT NULL,
  last_name            TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  -- default shipping address (optional, used to fill out checkout details)
  shipping_street      TEXT,
  shipping_city        TEXT,
  shipping_province    TEXT,
  shipping_country     TEXT,
  shipping_postal_code TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_street TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_province TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);

-- A temporary storage of order items while the user is still shopping
CREATE TABLE IF NOT EXISTS cart_items (
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (user_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id              INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status               TEXT NOT NULL CHECK (status IN ('PROCESSED', 'DENIED')),
  total                INTEGER NOT NULL CHECK (total >= 0),
  shipping_street      TEXT NOT NULL,
  shipping_city        TEXT NOT NULL,
  shipping_province    TEXT NOT NULL,
  shipping_country     TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A permanent record of order items, data remains unchanged if vehicles are updated/deleted
CREATE TABLE IF NOT EXISTS order_items (
  order_id    INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  vehicle_id  INTEGER NOT NULL,
  make        TEXT NOT NULL,
  model       TEXT NOT NULL,
  year        INTEGER NOT NULL,
  condition   TEXT NOT NULL,
  trim        TEXT NOT NULL,
  color       TEXT NOT NULL,
  mileage_km  INTEGER NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  INTEGER NOT NULL CHECK (unit_price >= 0),
  PRIMARY KEY (order_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS test_drives (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  vehicle_id   INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('at_home', 'virtual')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  address      TEXT,                                                       -- customer's address (null for virtual test drives)
  status     TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CANCELLED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A vehicle can only have one test drive per time slot. Cancelling a test drive frees its slot.
CREATE UNIQUE INDEX IF NOT EXISTS test_drives_one_per_slot ON test_drives (vehicle_id, scheduled_at) WHERE status = 'SCHEDULED';
