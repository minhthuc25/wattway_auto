CREATE TABLE vehicles (
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

CREATE TABLE users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,                       -- stored in lowercase
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);
