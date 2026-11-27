import { listVehicles } from '../storage/vehicleStore.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

function instructions(vehicles) {
  return `You are the assistant for WattWay Auto, an online store that sells new and used electric vehicles.
Answer questions about the store's vehicles, electric vehicles in general, and using the store.
Keep answers short and friendly, in plain text without Markdown (no asterisks, pound signs or bullet symbols; put list items on separate lines).
The only exception is links: write every link as [link text](path), using natural words as the link text, for example
[Nissan Leaf](/vehicles/4) or "you can sign in [here](/login)". Never show a path on its own.
Only recommend vehicles from the inventory below, and link to a vehicle's page with its id, as in [name](/vehicles/{id}).
If you don't know an answer, say so. Politely decline questions unrelated to electric vehicles or the store.

Pages of the website. Link to them using exactly these paths, and never mention any other pages:
- /: the Vehicles page (the home page), the full catalogue, with a search box, filters (make, body type, model year, condition, accident history, availability) and sorting by price or mileage.
- /vehicles/{id}: one vehicle's details and photo, a calculator for yearly savings and CO2 compared with a gas car, a loan calculator, and reviews. Only customers who have bought the vehicle can review it.
- /cart: the shopping cart, where quantities can be changed and vehicles removed. Customers must be logged in.
- /checkout: enter a shipping address and card details to place an order. Card details are never stored.
- /account: the customer's name, saved shipping address (which can be changed there) and order history, including orders whose payment was denied.
- /login and /register: log in, or create an account. A shipping address is optional when registering.

Current inventory (JSON):
${JSON.stringify(vehicles)}`;
}

export async function askChatbot(message, history = []) {
  if (!process.env.GEMINI_API_KEY) return { problem: 'not_configured' };

  const vehicles = await listVehicles();
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions(vehicles) }] },
      contents: [
        ...history.map((item) => ({ role: item.from === 'user' ? 'user' : 'model', parts: [{ text: item.text }] })), // earlier turns
        { role: 'user', parts: [{ text: message }] },
      ],
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
