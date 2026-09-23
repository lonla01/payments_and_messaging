import { db } from '../db.js';

const insertStmt = db.prepare(`
  INSERT INTO payments (reference, amount, currency, phone, channel, status)
  VALUES (@reference, @amount, @currency, @phone, @channel, @status)
`);

const findByReferenceStmt = db.prepare('SELECT * FROM payments WHERE reference = ?');
const listStmt = db.prepare('SELECT * FROM payments ORDER BY created_at DESC');

const updateStmt = db.prepare(`
  UPDATE payments SET
    status = COALESCE(@status, status),
    payment_url = COALESCE(@paymentUrl, payment_url),
    payment_token = COALESCE(@paymentToken, payment_token),
    operator_id = COALESCE(@operatorId, operator_id),
    raw_check_response = COALESCE(@rawCheckResponse, raw_check_response),
    updated_at = datetime('now')
  WHERE reference = @reference
`);

function toApiShape(row) {
  if (!row) return null;
  return {
    reference: row.reference,
    amount: row.amount,
    currency: row.currency,
    phone: row.phone,
    channel: row.channel,
    status: row.status,
    paymentUrl: row.payment_url,
    paymentToken: row.payment_token,
    operatorId: row.operator_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const paymentsRepository = {
  create({ reference, amount, currency = 'XAF', phone, channel, status = 'PENDING' }) {
    insertStmt.run({ reference, amount, currency, phone, channel, status });
    return toApiShape(findByReferenceStmt.get(reference));
  },

  findByReference(reference) {
    return toApiShape(findByReferenceStmt.get(reference));
  },

  update(reference, { status, paymentUrl, paymentToken, operatorId, rawCheckResponse }) {
    updateStmt.run({
      reference,
      status: status ?? null,
      paymentUrl: paymentUrl ?? null,
      paymentToken: paymentToken ?? null,
      operatorId: operatorId ?? null,
      rawCheckResponse: rawCheckResponse ?? null,
    });
    return toApiShape(findByReferenceStmt.get(reference));
  },

  list() {
    return listStmt.all().map(toApiShape);
  },
};
