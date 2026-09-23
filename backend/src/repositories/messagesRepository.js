import { db } from '../db.js';

const insertStmt = db.prepare(`
  INSERT INTO messages (recipient_phone, requested_channel, message_type, amount, due_date, body, status)
  VALUES (@recipientPhone, @requestedChannel, @messageType, @amount, @dueDate, @body, @status)
`);

const findByIdStmt = db.prepare('SELECT * FROM messages WHERE id = ?');
const listStmt = db.prepare('SELECT * FROM messages ORDER BY created_at DESC');
const findByTwilioSidStmt = db.prepare('SELECT * FROM messages WHERE twilio_sid = ?');

const updateStmt = db.prepare(`
  UPDATE messages SET
    effective_channel = COALESCE(@effectiveChannel, effective_channel),
    status = COALESCE(@status, status),
    twilio_sid = COALESCE(@twilioSid, twilio_sid),
    error_code = COALESCE(@errorCode, error_code),
    fallback_reason = COALESCE(@fallbackReason, fallback_reason),
    simulated = COALESCE(@simulated, simulated),
    updated_at = datetime('now')
  WHERE id = @id
`);

function toApiShape(row) {
  if (!row) return null;
  return {
    id: row.id,
    recipientPhone: row.recipient_phone,
    requestedChannel: row.requested_channel,
    effectiveChannel: row.effective_channel,
    messageType: row.message_type,
    amount: row.amount,
    dueDate: row.due_date,
    body: row.body,
    twilioSid: row.twilio_sid,
    status: row.status,
    errorCode: row.error_code,
    fallbackReason: row.fallback_reason,
    simulated: Boolean(row.simulated),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const messagesRepository = {
  create({ recipientPhone, requestedChannel, messageType, amount, dueDate, body, status = 'QUEUED' }) {
    const info = insertStmt.run({ recipientPhone, requestedChannel, messageType, amount, dueDate, body, status });
    return toApiShape(findByIdStmt.get(info.lastInsertRowid));
  },

  findById(id) {
    return toApiShape(findByIdStmt.get(id));
  },

  findByTwilioSid(sid) {
    return toApiShape(findByTwilioSidStmt.get(sid));
  },

  update(id, { effectiveChannel, status, twilioSid, errorCode, fallbackReason, simulated }) {
    updateStmt.run({
      id,
      effectiveChannel: effectiveChannel ?? null,
      status: status ?? null,
      twilioSid: twilioSid ?? null,
      errorCode: errorCode ?? null,
      fallbackReason: fallbackReason ?? null,
      simulated: simulated === undefined ? null : (simulated ? 1 : 0),
    });
    return toApiShape(findByIdStmt.get(id));
  },

  updateStatusByTwilioSid(sid, { status, errorCode }) {
    const row = findByTwilioSidStmt.get(sid);
    if (!row) return null;
    return this.update(row.id, { status, errorCode });
  },

  list() {
    return listStmt.all().map(toApiShape);
  },
};
