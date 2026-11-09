// Mock payment every third request is denied.
// The count is kept in memory, so it starts again when the server restarts.
let requestCount = 0;

// A real payment provider would charge this card; the mock only counts requests.
export function authorizePayment(card) {
  requestCount += 1;
  return requestCount % 3 !== 0;
}
