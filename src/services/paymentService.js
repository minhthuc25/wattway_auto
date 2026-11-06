// Mock payment every third request is denied.
// The count is kept in memory, so it starts again when the server restarts.
let requestCount = 0;

// TODO: take the customer's card details here
export function authorizePayment() {
  requestCount += 1;
  return requestCount % 3 !== 0;
}
