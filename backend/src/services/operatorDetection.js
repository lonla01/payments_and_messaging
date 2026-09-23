// Detection approximative de l'operateur mobile camerounais a partir du numero.
// Base sur les plages de prefixes generalement documentees ; a reconfirmer/mettre a jour
// au besoin (portabilite des numeros, nouvelles attributions ANTIC).
const MTN_PREFIXES = ['67', '650', '651', '652', '653', '654', '680', '681', '682', '683', '684'];
const ORANGE_PREFIXES = ['69', '655', '656', '657', '658', '659'];

function localNumber(phone) {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('237')) return digits.slice(3);
  return digits;
}

export function detectCameroonOperator(phone) {
  const local = localNumber(phone);
  if (MTN_PREFIXES.some((prefix) => local.startsWith(prefix))) return 'MTN_CM';
  if (ORANGE_PREFIXES.some((prefix) => local.startsWith(prefix))) return 'ORANGE_CM';
  return 'UNKNOWN';
}
