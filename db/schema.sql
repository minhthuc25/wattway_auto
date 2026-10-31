-- WattWay Auto database schema (PostgreSQL).
-- Run automatically on the server's first start; see src/storage/db.js.

CREATE TABLE vehicles (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  make           TEXT    NOT NULL,
  model          TEXT    NOT NULL,
  year           INTEGER NOT NULL CHECK (year >= 1886),
  price          INTEGER NOT NULL CHECK (price >= 0),          -- whole dollars
  condition      TEXT    NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used')),
  trim           TEXT    NOT NULL DEFAULT '',
  color          TEXT    NOT NULL DEFAULT '',
  body_type      TEXT    NOT NULL DEFAULT '',                  -- sedan, suv, hatchback, truck, ...
  range_km       INTEGER NOT NULL CHECK (range_km > 0),
  battery_kwh    REAL    NOT NULL CHECK (battery_kwh > 0),     -- with range_km, gives efficiency for the savings calculator
  mileage_km     INTEGER NOT NULL DEFAULT 0 CHECK (mileage_km >= 0),
  has_accidents  BOOLEAN NOT NULL DEFAULT FALSE,
  history_report TEXT    NOT NULL DEFAULT '',
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  description    TEXT    NOT NULL DEFAULT '',
  image_url      TEXT    NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
