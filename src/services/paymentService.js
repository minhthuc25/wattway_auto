let requestCount = 0; // in memory, so it resets when the server restarts

// mock: the card is never charged, every third request is denied
export function authorizePayment(card) {
  requestCount += 1;
  return requestCount % 3 !== 0;
}
