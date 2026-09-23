import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { paymentsRepository } from '../repositories/paymentsRepository.js';
import { initiatePayment } from '../services/cinetpayService.js';

export const paymentsRouter = Router();

const VALID_CHANNELS = ['ORANGE_MONEY', 'MTN_MOBILE_MONEY'];

paymentsRouter.post(
  '/initiate',
  asyncHandler(async (req, res) => {
    const { amount, phone, channel, reference } = req.body;

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount doit etre un entier positif (FCFA, sans decimales).' });
    }
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'phone est requis.' });
    }
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ error: `channel doit etre l'un de: ${VALID_CHANNELS.join(', ')}.` });
    }

    const transactionId = (reference && reference.trim()) || `test-${Date.now()}`;

    if (paymentsRepository.findByReference(transactionId)) {
      return res.status(409).json({ error: `La reference "${transactionId}" existe deja.` });
    }

    paymentsRepository.create({ reference: transactionId, amount, phone, channel });

    try {
      const result = await initiatePayment({ transactionId, amount, phone, channel });
      const updated = paymentsRepository.update(transactionId, {
        paymentUrl: result.paymentUrl,
        paymentToken: result.paymentToken,
      });
      return res.status(201).json(updated);
    } catch (err) {
      paymentsRepository.update(transactionId, {
        status: 'FAILED',
        rawCheckResponse: JSON.stringify(err.cinetpayResponse || { message: err.message }),
      });
      const statusCode = err.code === 'CINETPAY_NOT_CONFIGURED' ? 500 : 502;
      return res.status(statusCode).json({ error: "Echec de l'initiation aupres de CinetPay", details: err.message });
    }
  })
);

paymentsRouter.get(
  '/history',
  asyncHandler(async (_req, res) => {
    res.json(paymentsRepository.list());
  })
);

paymentsRouter.get(
  '/:reference/status',
  asyncHandler(async (req, res) => {
    const payment = paymentsRepository.findByReference(req.params.reference);
    if (!payment) return res.status(404).json({ error: 'Paiement introuvable.' });
    res.json(payment);
  })
);
