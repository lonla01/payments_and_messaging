import 'dotenv/config';

const port = process.env.PORT || 4000;
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

export const config = {
  port,
  publicBaseUrl,
  frontendBaseUrl,

  cinetpay: {
    apiKey: process.env.CINETPAY_API_KEY || '',
    siteId: process.env.CINETPAY_SITE_ID || '',
    secretKey: process.env.CINETPAY_SECRET_KEY || '',
    notifyUrl: process.env.CINETPAY_NOTIFY_URL || `${publicBaseUrl}/webhooks/cinetpay`,
    returnUrl: process.env.CINETPAY_RETURN_URL || `${frontendBaseUrl}/paiement`,
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    apiKeySid: process.env.TWILIO_API_KEY_SID || '',
    apiKeySecret: process.env.TWILIO_API_KEY_SECRET || '',
    // Uniquement pour verifier la signature des webhooks entrants, jamais pour les appels sortants.
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
    contentSidByType: {
      RAPPEL: process.env.TWILIO_WHATSAPP_CONTENT_SID_RAPPEL || '',
      RELANCE: process.env.TWILIO_WHATSAPP_CONTENT_SID_RELANCE || '',
    },
    whatsappSimulationMode: process.env.WHATSAPP_SIMULATION_MODE !== 'false',
    smsSenderIdOrangeCm: process.env.TWILIO_SMS_SENDER_ID_ORANGE_CM || '',
    smsSenderIdMtnCm: process.env.TWILIO_SMS_SENDER_ID_MTN_CM || '',
    smsLongCodeFallback: process.env.TWILIO_SMS_LONGCODE_FALLBACK || '',
    statusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL || `${publicBaseUrl}/webhooks/twilio/status`,
  },
};
