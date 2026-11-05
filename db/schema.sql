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
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,                       -- stored in lowercase
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (user_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed')),
  total      BIGINT NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  vehicle_id  INTEGER NOT NULL,
  make        TEXT NOT NULL,
  model       TEXT NOT NULL,
  year        INTEGER NOT NULL,
  condition   TEXT NOT NULL,
  trim        TEXT NOT NULL,
  color       TEXT NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  INTEGER NOT NULL CHECK (unit_price >= 0),
  line_total  BIGINT NOT NULL CHECK (line_total >= 0)
);
