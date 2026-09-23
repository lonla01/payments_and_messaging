import twilioLib from 'twilio';
import { config } from '../config.js';
import { detectCameroonOperator } from './operatorDetection.js';
import { buildContentVariables, buildMessageBody } from './messageTemplates.js';

function getClient() {
  if (!config.twilio.accountSid || !config.twilio.apiKeySid || !config.twilio.apiKeySecret) {
    const err = new Error(
      'TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID et TWILIO_API_KEY_SECRET doivent etre renseignes dans backend/.env pour appeler Twilio.'
    );
    err.code = 'TWILIO_NOT_CONFIGURED';
    throw err;
  }
  // Cle API restreinte (jamais l'Auth Token principal) pour les appels sortants.
  return twilioLib(config.twilio.apiKeySid, config.twilio.apiKeySecret, {
    accountSid: config.twilio.accountSid,
  });
}

function pickSmsSender(operator) {
  if (operator === 'ORANGE_CM' && config.twilio.smsSenderIdOrangeCm) {
    return config.twilio.smsSenderIdOrangeCm;
  }
  if (operator === 'MTN_CM' && config.twilio.smsSenderIdMtnCm) {
    return config.twilio.smsSenderIdMtnCm;
  }
  // MTN Cameroun necessite un identifiant alphanumerique pre-enregistre via Twilio Trust
  // Hub (~3 semaines). Tant que ce n'est pas fait (ou pour un operateur non reconnu),
  // on replie sur un numero long code international pour ne pas bloquer les tests.
  return config.twilio.smsLongCodeFallback;
}

async function sendSms({ phone, messageType, amount, dueDate, fallbackReason }) {
  const client = getClient();
  const operator = detectCameroonOperator(phone);
  const from = pickSmsSender(operator);

  if (!from) {
    const err = new Error(
      "Aucun expediteur SMS disponible : configurer TWILIO_SMS_SENDER_ID_ORANGE_CM et/ou TWILIO_SMS_LONGCODE_FALLBACK."
    );
    err.code = 'TWILIO_SMS_SENDER_MISSING';
    throw err;
  }

  const body = buildMessageBody({ messageType, amount, dueDate });
  const message = await client.messages.create({
    to: phone,
    from,
    body,
    statusCallback: config.twilio.statusCallbackUrl,
  });

  return {
    effectiveChannel: 'SMS',
    status: 'QUEUED',
    simulated: false,
    sid: message.sid,
    body,
    operator,
    fallbackReason,
  };
}

export async function sendMessage({ phone, channel, messageType, amount, dueDate }) {
  if (channel !== 'WHATSAPP') {
    return sendSms({ phone, messageType, amount, dueDate });
  }

  if (config.twilio.whatsappSimulationMode) {
    return {
      effectiveChannel: 'WHATSAPP',
      status: 'SIMULATED',
      simulated: true,
      sid: `SIMULATED-${Date.now()}`,
      body: buildMessageBody({ messageType, amount, dueDate }),
    };
  }

  const contentSid = config.twilio.contentSidByType[messageType];
  if (!contentSid) {
    // Pas de template approuve configure : on bascule directement sur SMS plutot que
    // d'echouer, comme le ferait un vrai rejet de template par Meta/Twilio.
    return sendSms({
      phone,
      messageType,
      amount,
      dueDate,
      fallbackReason: `Aucun Content SID WhatsApp configure pour ${messageType}`,
    });
  }

  try {
    const client = getClient();
    if (!config.twilio.messagingServiceSid) {
      const err = new Error('TWILIO_MESSAGING_SERVICE_SID doit etre renseigne dans backend/.env.');
      err.code = 'TWILIO_NOT_CONFIGURED';
      throw err;
    }

    const message = await client.messages.create({
      messagingServiceSid: config.twilio.messagingServiceSid,
      to: `whatsapp:${phone}`,
      contentSid,
      contentVariables: buildContentVariables({ amount, dueDate }),
      statusCallback: config.twilio.statusCallbackUrl,
    });

    return {
      effectiveChannel: 'WHATSAPP',
      status: 'QUEUED',
      simulated: false,
      sid: message.sid,
    };
  } catch (err) {
    // Repli automatique SMS : template rejete, destinataire non opt-in WhatsApp, erreur Twilio...
    return sendSms({ phone, messageType, amount, dueDate, fallbackReason: err.message });
  }
}
