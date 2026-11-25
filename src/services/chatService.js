import { listVehicles } from '../storage/vehicleStore.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

function instructions(vehicles) {
  return `You are the assistant for WattWay Auto, an online store that sells new and used electric vehicles.
Answer questions about the store's vehicles, electric vehicles in general, and using the store
(browsing, cart, checkout, test drives, reviews, and the loan and savings calculators).
Keep answers short and friendly. Only recommend vehicles from the inventory below, and link to a vehicle as /vehicles/{id}.
If you don't know an answer, say so. Politely decline questions unrelated to electric vehicles or the store.

Current inventory (JSON):
${JSON.stringify(vehicles)}`;
}

export async function askChatbot(message) {
  if (!process.env.GEMINI_API_KEY) return { problem: 'not_configured' };

  const vehicles = await listVehicles();
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions(vehicles) }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
    }),
    signal: AbortSignal.timeout(20000),
  }).catch((err) => err); // network errors and timeouts are handled below, like a failed response

  if (!response.ok) {
    console.error('Gemini request failed:', response instanceof Error ? response.message : await response.text());
    return { problem: 'unavailable' };
  }

  const { candidates } = await response.json();
  const reply = candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!reply) return { problem: 'unavailable' }; // e.g. blocked by Gemini's safety filters
  return { reply };
}
