-- Sample data loaded on the server's first start.

INSERT INTO users (username, password_hash, first_name, last_name, role)
VALUES ('admin',
        '74aa85a753a98168954d20e3e671299a:cbad3106d9c472d88dcc5efa115f893092da251d2b5520ef987517dbf856e7317736322caef3533de448519a4fd25af91b435beead7521701dd95d4609e8d69d',
        'Store', 'Admin', 'admin');

INSERT INTO vehicles
  (make, model, year, price, condition, trim, color, body_type, range_km, battery_kwh, mileage_km, has_accidents, history_report, quantity, description)
VALUES
  ('Tesla', 'Model 3', 2025, 48990, 'new', 'Long Range AWD', 'Pearl White', 'sedan', 550, 75, 0, FALSE, '', 5,
   'Dual-motor sedan with long range and fast Supercharger access.'),
  ('Tesla', 'Model Y', 2024, 54990, 'new', 'Long Range AWD', 'Midnight Silver', 'suv', 533, 75, 0, FALSE, '', 4,
   'Midsize SUV with seating for five and a large cargo area.'),
  ('Ford', 'F-150 Lightning', 2024, 89900, 'new', 'Lariat Extended Range', 'Antimatter Blue', 'truck', 515, 131, 0, FALSE, '', 2,
   'Full-size electric pickup that can power your home during an outage.'),
  ('Nissan', 'Leaf', 2025, 42998, 'new', 'SV Plus', 'Gun Metallic', 'hatchback', 342, 60, 0, FALSE, '', 0,
   'Compact hatchback suited to city commuting.'),
  ('Hyundai', 'Ioniq 5', 2023, 38500, 'used', 'Preferred AWD Long Range', 'Gravity Gold', 'suv', 414, 77.4, 32000, FALSE,
   'One owner. No reported accidents. Regular dealer maintenance.', 1,
   'Retro-styled crossover with ultra-fast 800 V charging.'),
  ('Kia', 'EV6', 2022, 34900, 'used', 'GT-Line AWD', 'Runway Red', 'suv', 441, 77.4, 58000, TRUE,
   'Two owners. Minor rear-bumper collision reported in 2023, repaired at a certified body shop.', 1,
   'Sporty crossover with a panoramic sunroof and heat pump.'),
  ('Chevrolet', 'Bolt EV', 2021, 19995, 'used', '2LT', 'Summit White', 'hatchback', 417, 65, 71000, FALSE,
   'One owner. No reported accidents. Battery replaced under manufacturer recall in 2022.', 1,
   'Affordable hatchback with a recently replaced battery.'),
  ('Porsche', 'Taycan', 2023, 104900, 'used', '4S', 'Gentian Blue', 'sedan', 410, 93.4, 18000, TRUE,
   'One owner. Front-end damage reported in 2024 (parking incident), professionally repaired. Clean title.', 1,
   'High-performance sports sedan with adaptive air suspension.');
