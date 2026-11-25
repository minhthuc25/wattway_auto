#!/usr/bin/env bash
# Test cases for the back-end API. Start the server first, then run: bash tests/curl-tests.sh
# Each test prints what it expects, then the response body and its HTTP status (000 = the server could not be reached or did not answer within 60 seconds).
# To test locally, use: BASE=https://localhost:3000 bash tests/curl-tests.sh

BASE=${BASE:-https://wattway-auto.onrender.com}
JSON='Content-Type: application/json'
STATUS='\nHTTP %{http_code}\n\n'
USERNAME="tester$(date +%s)" # a new customer on every run
SHIPPING='"shipping":{"street":"123 Example St","city":"Toronto","province":"ON","country":"Canada","postalCode":"A1B 2C3"}'

echo "== T1 Health check (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/health"

# ---------- Accounts ----------

echo "== T2 Register a customer (expect 201)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/users" -H "$JSON" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"Customer\"}"

echo "== T3 Register the same username again (expect 409)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/users" -H "$JSON" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"Customer\"}"

echo "== T4 Register with a short password (expect 400)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/users" -H "$JSON" \
  -d '{"username":"shortpass","password":"123","firstName":"Test","lastName":"Customer"}'

echo "== T5 Log in with the wrong password (expect 401)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/sessions" -H "$JSON" -d "{\"username\":\"$USERNAME\",\"password\":\"wrong-password\"}"

echo "== T6 Log in as the customer (expect 201)"
RESPONSE=$(curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/sessions" -H "$JSON" -d "{\"username\":\"$USERNAME\",\"password\":\"password123\"}")
echo "$RESPONSE"; echo
TOKEN=$(echo "$RESPONSE" | head -n 1 | sed -E 's/.*"token":"([^"]+)".*/\1/') # saved for the tests below

echo "== T7 Get your own account (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/users/me" -H "Authorization: Bearer $TOKEN"

echo "== T8 Save a default shipping address (expect 200)"
curl -s -m 60 -w "$STATUS" -X PATCH "$BASE/api/users/me" -H "Authorization: Bearer $TOKEN" -H "$JSON" \
  -d '{"defaultShipping":{"street":"123 Example St","city":"Toronto","province":"ON","country":"Canada","postalCode":"A1B 2C3"}}'

# ---------- Vehicles (admin) ----------

echo "== T9 Log in as the admin (expect 201)"
RESPONSE=$(curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/sessions" -H "$JSON" -d '{"username":"admin","password":"admin"}')
echo "$RESPONSE"; echo
ADMIN_TOKEN=$(echo "$RESPONSE" | head -n 1 | sed -E 's/.*"token":"([^"]+)".*/\1/')

echo "== T10 Add a vehicle as the admin (expect 201)"
RESPONSE=$(curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/vehicles" -H "Authorization: Bearer $ADMIN_TOKEN" -H "$JSON" \
  -d '{"make":"Testmotors","model":"Volt Test","year":2025,"price":40000,"bodyType":"suv","rangeKm":450,"batteryKwh":70,"quantity":5}')
echo "$RESPONSE"; echo
VEHICLE_ID=$(echo "$RESPONSE" | head -n 1 | sed -E 's/[^0-9]*"id":([0-9]+).*/\1/')

echo "== T11 Add a vehicle as a customer (expect 403)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/vehicles" -H "Authorization: Bearer $TOKEN" -H "$JSON" \
  -d '{"make":"Testmotors","model":"Volt Test","year":2025,"price":40000,"rangeKm":450,"batteryKwh":70}'

echo "== T12 Add a vehicle with a missing field (expect 400)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/vehicles" -H "Authorization: Bearer $ADMIN_TOKEN" -H "$JSON" \
  -d '{"make":"Testmotors","model":"Volt Test","year":2025,"price":40000}'

echo "== T13 Update the vehicle's price (expect 200)"
curl -s -m 60 -w "$STATUS" -X PATCH "$BASE/api/vehicles/$VEHICLE_ID" -H "Authorization: Bearer $ADMIN_TOKEN" -H "$JSON" -d '{"price":39000}'

# ---------- Catalogue ----------

echo "== T14 List all vehicles (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/vehicles"

echo "== T15 Filter used vehicles without accidents, sorted by mileage (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/vehicles?condition=used&hasAccidents=false&sort=mileageKm&order=asc"

echo "== T16 Sort by an unknown field (expect 400)"
curl -s -m 60 -w "$STATUS" "$BASE/api/vehicles?sort=color"

echo "== T17 Get one vehicle (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/vehicles/$VEHICLE_ID"

echo "== T18 Get a vehicle that does not exist (expect 404)"
curl -s -m 60 -w "$STATUS" "$BASE/api/vehicles/999999"

# ---------- Cart ----------

echo "== T19 Get the cart without logging in (expect 401)"
curl -s -m 60 -w "$STATUS" "$BASE/api/cart"

echo "== T20 Add 2 of the vehicle to the cart (expect 200)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/cart/items" -H "Authorization: Bearer $TOKEN" -H "$JSON" -d "{\"vehicleId\":$VEHICLE_ID,\"quantity\":2}"

echo "== T21 Change the quantity to 1 (expect 200)"
curl -s -m 60 -w "$STATUS" -X PATCH "$BASE/api/cart/items/$VEHICLE_ID" -H "Authorization: Bearer $TOKEN" -H "$JSON" -d '{"quantity":1}'

echo "== T22 Change the quantity to more than is in stock (expect 409)"
curl -s -m 60 -w "$STATUS" -X PATCH "$BASE/api/cart/items/$VEHICLE_ID" -H "Authorization: Bearer $TOKEN" -H "$JSON" -d '{"quantity":99}'

echo "== T23 Remove the vehicle from the cart (expect 200, empty cart)"
curl -s -m 60 -w "$STATUS" -X DELETE "$BASE/api/cart/items/$VEHICLE_ID" -H "Authorization: Bearer $TOKEN"

echo "== T24 Add the vehicle back (expect 200)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/cart/items" -H "Authorization: Bearer $TOKEN" -H "$JSON" -d "{\"vehicleId\":$VEHICLE_ID}"

# ---------- Checkout ----------

echo "== T25 Check out with an invalid card number (expect 400)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/orders" -H "Authorization: Bearer $TOKEN" -H "$JSON" \
  -d "{$SHIPPING,\"card\":{\"number\":\"1234\",\"expiry\":\"12/30\",\"cvv\":\"123\"}}"

echo "== T26 Check out (expect 201; every third payment since the server started is denied with 402)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/orders" -H "Authorization: Bearer $TOKEN" -H "$JSON" \
  -d "{$SHIPPING,\"card\":{\"number\":\"4111111111111111\",\"expiry\":\"12/30\",\"cvv\":\"123\"}}"

echo "== T27 List your orders (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/orders" -H "Authorization: Bearer $TOKEN"

# ---------- Reviews ----------

echo "== T28 Review the purchased vehicle (expect 201; 403 if T26 was denied)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/vehicles/$VEHICLE_ID/reviews" -H "Authorization: Bearer $TOKEN" -H "$JSON" \
  -d '{"rating":5,"comment":"Great daily driver."}'

echo "== T29 Review a vehicle you have not purchased (expect 403)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/vehicles/1/reviews" -H "Authorization: Bearer $TOKEN" -H "$JSON" -d '{"rating":4}'

echo "== T30 Get the vehicle's reviews and average rating (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/vehicles/$VEHICLE_ID/reviews"

# ---------- Test drives ----------

echo "== T31 Book a virtual test drive (expect 201)"
RESPONSE=$(curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/test-drives" -H "Authorization: Bearer $TOKEN" -H "$JSON" \
  -d "{\"vehicleId\":$VEHICLE_ID,\"type\":\"virtual\",\"scheduledAt\":\"2030-12-01T15:00:00-05:00\"}")
echo "$RESPONSE"; echo
TEST_DRIVE_ID=$(echo "$RESPONSE" | head -n 1 | sed -E 's/[^0-9]*"id":([0-9]+).*/\1/')

echo "== T32 Book an at-home test drive without an address (expect 400)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/test-drives" -H "Authorization: Bearer $TOKEN" -H "$JSON" \
  -d "{\"vehicleId\":$VEHICLE_ID,\"type\":\"at_home\",\"scheduledAt\":\"2030-12-01T16:00:00-05:00\"}"

echo "== T33 Cancel the test drive (expect 200)"
curl -s -m 60 -w "$STATUS" -X PATCH "$BASE/api/test-drives/$TEST_DRIVE_ID" -H "Authorization: Bearer $TOKEN" -H "$JSON" -d '{"status":"CANCELLED"}'

# ---------- Calculators and chatbot ----------

echo "== T34 Loan calculator (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/loan?price=40000&downPayment=10000&rate=6&months=60"

echo "== T35 Loan calculator with a down payment above the price (expect 400)"
curl -s -m 60 -w "$STATUS" "$BASE/api/loan?price=40000&downPayment=50000&rate=6&months=60"

echo "== T36 Savings calculator (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/vehicles/$VEHICLE_ID/savings?kmPerYear=20000"

echo "== T37 Ask the chatbot (expect 200; 503 if GEMINI_API_KEY is not set)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/chat" -H "$JSON" -d '{"message":"Which SUVs do you have?"}'

# ---------- Analytics (admin) ----------

echo "== T38 Sales report as a customer (expect 403)"
curl -s -m 60 -w "$STATUS" "$BASE/api/analytics/sales?year=$(date +%Y)" -H "Authorization: Bearer $TOKEN"

echo "== T39 Sales report for this year (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/analytics/sales?year=$(date +%Y)" -H "Authorization: Bearer $ADMIN_TOKEN"

echo "== T40 Website usage report (expect 200)"
curl -s -m 60 -w "$STATUS" "$BASE/api/analytics/usage" -H "Authorization: Bearer $ADMIN_TOKEN"

# ---------- Security ----------

echo "== T41 SQL injection in the login username (expect 401, not a login)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/sessions" -H "$JSON" -d "{\"username\":\"admin' --\",\"password\":\"anything\"}"

echo "== T42 SQL injection in the search filter (expect 200, the text is only searched for, or 403 on Render as its firewall blocks it first)"
curl -s -m 60 -w "$STATUS" "$BASE/api/vehicles?search=%27%20OR%201%3D1%20--"

echo "== T43 Script tag in a name (expect 201; the name is stored and returned as plain text, never run)"
curl -s -m 60 -w "$STATUS" -X POST "$BASE/api/users" -H "$JSON" \
  -d "{\"username\":\"x$USERNAME\",\"password\":\"password123\",\"firstName\":\"<script>alert(1)</script>\",\"lastName\":\"Customer\"}"

# ---------- Clean up ----------

echo "== T44 Delete the test vehicle (expect 204)"
curl -s -m 60 -w "$STATUS" -X DELETE "$BASE/api/vehicles/$VEHICLE_ID" -H "Authorization: Bearer $ADMIN_TOKEN"

echo "== T45 Log out (expect 204)"
curl -s -m 60 -w "$STATUS" -X DELETE "$BASE/api/sessions/current" -H "Authorization: Bearer $TOKEN"

echo "== T46 Use the token after logging out (expect 401)"
curl -s -m 60 -w "$STATUS" "$BASE/api/users/me" -H "Authorization: Bearer $TOKEN"
