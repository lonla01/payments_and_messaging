import { Router } from 'express';
import twilioLib from 'twilio';
import { asyncHandler } from '../lib/asyncHandler.js';
import { paymentsRepository } from '../repositories/paymentsRepository.js';
import { messagesRepository } from '../repositories/messagesRepository.js';
import { checkTransactionStatus, mapCinetpayStatus, verifyNotificationSignature } from '../services/cinetpayService.js';
import { config } from '../config.js';

export const webhooksRouter = Router();

// CinetPay precise que le notify_url doit accepter aussi bien GET que POST.
const handleCinetpayNotification = asyncHandler(async (req, res) => {
  const fields = req.method === 'GET' ? req.query : req.body;
  const receivedToken = req.headers['x-token'];
  const { verified, skipped, reason } = verifyNotificationSignature(fields, receivedToken);

  if (!skipped && !verified) {
    console.warn('[webhook cinetpay] signature invalide:', reason);
    return res.status(400).send('invalid signature');
  }
  if (skipped) {
    console.warn('[webhook cinetpay] verification de signature ignoree:', reason);
  }

  const transactionId = fields.cpm_trans_id;
  if (!transactionId) {
    return res.status(400).send('cpm_trans_id manquant');
  }

  const payment = paymentsRepository.findByReference(transactionId);
  if (!payment) {
    console.warn(`[webhook cinetpay] transaction inconnue: ${transactionId}`);
    return res.status(404).send('transaction inconnue');
  }

  try {
    // Le statut n'est jamais pris depuis le corps de la notification (non fiable) :
    // on interroge CinetPay pour obtenir la valeur faisant foi.
    const checkResult = await checkTransactionStatus(transactionId);
    paymentsRepository.update(transactionId, {
      status: mapCinetpayStatus(checkResult?.data?.status),
      operatorId: checkResult?.data?.operator_id,
      rawCheckResponse: JSON.stringify(checkResult),
    });
  } catch (err) {
    console.error('[webhook cinetpay] echec de la verification du statut:', err.message);
  }

  res.status(200).send('ok');
});

webhooksRouter.post('/cinetpay', handleCinetpayNotification);
webhooksRouter.get('/cinetpay', handleCinetpayNotification);

webhooksRouter.post(
  '/twilio/status',
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-twilio-signature'];
    const fullUrl = config.twilio.statusCallbackUrl;

    if (config.twilio.authToken) {
      const valid = twilioLib.validateRequest(config.twilio.authToken, signature, fullUrl, req.body);
      if (!valid) {
        console.warn('[webhook twilio] signature invalide');
        return res.status(400).send('invalid signature');
      }
    } else {
      console.warn('[webhook twilio] TWILIO_AUTH_TOKEN non configure, verification de signature ignoree');
    }

    const { MessageSid, MessageStatus, ErrorCode } = req.body;
    if (!MessageSid) return res.status(400).send('MessageSid manquant');

    const updated = messagesRepository.updateStatusByTwilioSid(MessageSid, {
      status: (MessageStatus || '').toUpperCase() || undefined,
      errorCode: ErrorCode || undefined,
    });

    if (!updated) {
      console.warn(`[webhook twilio] message inconnu pour sid: ${MessageSid}`);
    }

    res.status(200).send('ok');
  })
);
