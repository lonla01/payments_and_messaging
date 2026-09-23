import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import './db.js';
import { paymentsRouter } from './routes/payments.js';
import { messagesRouter } from './routes/messages.js';
import { webhooksRouter } from './routes/webhooks.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/payments', paymentsRouter);
app.use('/messages', messagesRouter);
app.use('/webhooks', webhooksRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne', details: err.message });
});

app.listen(config.port, () => {
  console.log(`Backend prototype paiements/messagerie demarre sur http://localhost:${config.port}`);
  if (config.twilio.whatsappSimulationMode) {
    console.log('[info] Mode simulation WhatsApp actif (WHATSAPP_SIMULATION_MODE=true)');
  }
});
