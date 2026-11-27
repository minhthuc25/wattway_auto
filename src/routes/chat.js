import { Router } from 'express';
import { askChatbot } from '../services/chatService.js';
import { validateChat } from '../validation/validators.js';

const router = Router();

router.post('/', async (req, res) => {
  const result = validateChat(req.body);
  if (result) return res.status(400).json({ error: result });

  const { problem, reply } = await askChatbot(req.body.message, req.body.history);
  if (problem === 'not_configured') return res.status(503).json({ error: 'Chatbot is not available' });
  if (problem === 'unavailable') return res.status(502).json({ error: 'Chatbot is not available right now' });
  res.json({ data: { reply } });
});

export default router;
