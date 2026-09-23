import axios from 'axios';
import crypto from 'node:crypto';
import { config } from '../config.js';

const CINETPAY_BASE_URL = 'https://api-checkout.cinetpay.com/v2';

// Champs a concatener, dans cet ordre exact, pour verifier le x-token HMAC envoye
// par CinetPay sur le notify_url. Cf. https://docs.cinetpay.com/api/1.0-en/checkout/notification
const HMAC_FIELDS_ORDER = [
  'cpm_site_id', 'cpm_trans_id', 'cpm_trans_date', 'cpm_amount', 'cpm_currency',
  'signature', 'payment_method', 'cel_phone_num', 'cpm_phone_prefixe', 'cpm_language',
  'cpm_version', 'cpm_payment_config', 'cpm_page_action', 'cpm_custom', 'cpm_designation',
  'cpm_error_message',
];

// Selection directe de l'operateur au moment de l'initiation : selon la configuration
// du compte CinetPay (integration "seamless"), ce champ peut ne pas etre pris en compte
// et l'utilisateur choisit alors son operateur sur la page de paiement CinetPay.
// A confirmer avec le support CinetPay une fois les cles reelles en main.
const CHANNEL_TO_PAYMENT_METHOD = {
  ORANGE_MONEY: 'OM',
  MTN_MOBILE_MONEY: 'MOMO',
};

function assertConfigured() {
  if (!config.cinetpay.apiKey || !config.cinetpay.siteId) {
    const err = new Error(
      "CINETPAY_API_KEY et CINETPAY_SITE_ID doivent etre renseignes dans backend/.env pour appeler CinetPay."
    );
    err.code = 'CINETPAY_NOT_CONFIGURED';
    throw err;
  }
}

export async function initiatePayment({ transactionId, amount, phone, channel, description }) {
  assertConfigured();

  const payload = {
    apikey: config.cinetpay.apiKey,
    site_id: config.cinetpay.siteId,
    transaction_id: transactionId,
    amount,
    currency: 'XAF',
    description: description || `Paiement test ${transactionId}`,
    notify_url: config.cinetpay.notifyUrl,
    return_url: config.cinetpay.returnUrl,
    channels: 'MOBILE_MONEY',
    customer_phone_number: phone,
    payment_method: CHANNEL_TO_PAYMENT_METHOD[channel],
  };

  const { data } = await axios.post(`${CINETPAY_BASE_URL}/payment`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  if (String(data.code) !== '201') {
    const err = new Error(data.message || "Echec de l'initiation du paiement CinetPay");
    err.cinetpayResponse = data;
    throw err;
  }

  return {
    paymentUrl: data.data.payment_url,
    paymentToken: data.data.payment_token,
    raw: data,
  };
}

export async function checkTransactionStatus(transactionId) {
  assertConfigured();

  const payload = {
    apikey: config.cinetpay.apiKey,
    site_id: config.cinetpay.siteId,
    transaction_id: transactionId,
  };

  const { data } = await axios.post(`${CINETPAY_BASE_URL}/payment/check`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  return data;
}

// CinetPay ne transmet volontairement pas le statut final dans la notification
// (pour eviter les attaques de type man-in-the-middle) : le x-token HMAC permet
// seulement de verifier l'authenticite de l'appelant. Le statut reel doit toujours
// etre obtenu via checkTransactionStatus().
export function verifyNotificationSignature(fields, receivedToken) {
  if (!config.cinetpay.secretKey) {
    return { verified: false, reason: 'CINETPAY_SECRET_KEY non configure', skipped: true };
  }
  if (!receivedToken) {
    return { verified: false, reason: 'en-tete x-token absent' };
  }

  const concatenated = HMAC_FIELDS_ORDER.map((key) => fields[key] ?? '').join('');
  const expected = crypto
    .createHmac('sha256', config.cinetpay.secretKey)
    .update(concatenated)
    .digest('hex');

  return { verified: expected === receivedToken };
}

export function mapCinetpayStatus(status) {
  switch (status) {
    case 'ACCEPTED':
      return 'SUCCEEDED';
    case 'REFUSED':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}
