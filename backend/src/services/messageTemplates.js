export function buildMessageBody({ messageType, amount, dueDate }) {
  const formattedAmount = `${amount} FCFA`;

  if (messageType === 'RAPPEL') {
    return `Bonjour, ceci est un rappel : votre loyer de ${formattedAmount} est a echeance le ${dueDate}. Merci de proceder au paiement.`;
  }

  if (messageType === 'RELANCE') {
    return `Bonjour, votre paiement de ${formattedAmount} etait attendu le ${dueDate} et reste impaye a ce jour. Merci de regulariser votre situation rapidement.`;
  }

  throw new Error(`Type de message inconnu: ${messageType}`);
}

// Variables numerotees attendues par les templates WhatsApp Utility (Content API Twilio).
export function buildContentVariables({ amount, dueDate }) {
  return JSON.stringify({ 1: String(amount), 2: dueDate });
}
