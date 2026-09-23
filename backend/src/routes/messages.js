import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { messagesRepository } from '../repositories/messagesRepository.js';
import { sendMessage } from '../services/twilioService.js';
import { buildMessageBody } from '../services/messageTemplates.js';

export const messagesRouter = Router();

const VALID_CHANNELS = ['WHATSAPP', 'SMS'];
const VALID_TYPES = ['RAPPEL', 'RELANCE'];

messagesRouter.post(
  '/send',
  asyncHandler(async (req, res) => {
    const { phone, channel, messageType, amount, dueDate } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'phone est requis.' });
    }
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ error: `channel doit etre l'un de: ${VALID_CHANNELS.join(', ')}.` });
    }
    if (!VALID_TYPES.includes(messageType)) {
      return res.status(400).json({ error: `messageType doit etre l'un de: ${VALID_TYPES.join(', ')}.` });
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount doit etre un entier positif (FCFA, sans decimales).' });
    }
    if (!dueDate) {
      return res.status(400).json({ error: 'dueDate est requis.' });
    }

    const body = buildMessageBody({ messageType, amount, dueDate });
    const record = messagesRepository.create({
      recipientPhone: phone,
      requestedChannel: channel,
      messageType,
      amount,
      dueDate,
      body,
    });

    try {
      const result = await sendMessage({ phone, channel, messageType, amount, dueDate });
      const updated = messagesRepository.update(record.id, {
        effectiveChannel: result.effectiveChannel,
        status: result.status,
        twilioSid: result.sid,
        simulated: result.simulated,
        fallbackReason: result.fallbackReason,
      });
      return res.status(201).json(updated);
    } catch (err) {
      const updated = messagesRepository.update(record.id, {
        status: 'FAILED',
        errorCode: err.code || err.message,
      });
      const statusCode = err.code && err.code.endsWith('_NOT_CONFIGURED') ? 500 : 502;
      return res.status(statusCode).json({ error: "Echec de l'envoi du message", details: err.message, message: updated });
    }
  })
);

messagesRouter.get(
  '/history',
  asyncHandler(async (_req, res) => {
    res.json(messagesRepository.list());
  })
);
