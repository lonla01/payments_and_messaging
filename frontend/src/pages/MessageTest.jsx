import { useState } from 'react';
import { api, extractErrorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function MessageTest() {
  const [phone, setPhone] = useState('+237690000000');
  const [channel, setChannel] = useState('WHATSAPP');
  const [messageType, setMessageType] = useState('RAPPEL');
  const [amount, setAmount] = useState(5000);
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setResult(null);

    try {
      const { data } = await api.post('/messages/send', {
        phone,
        channel,
        messageType,
        amount: Number(amount),
        dueDate,
      });
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
      if (err.response?.data?.message) setResult(err.response.data.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h2>Test d'envoi de message</h2>
      <p className="muted">Envoie un rappel ou une relance via WhatsApp, avec repli automatique sur SMS.</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Numero de telephone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237690000000" required />
        </label>

        <label>
          Canal prefere
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="WHATSAPP">WhatsApp (repli SMS si echec)</option>
            <option value="SMS">SMS direct</option>
          </select>
        </label>

        <label>
          Type de message
          <select value={messageType} onChange={(e) => setMessageType(e.target.value)}>
            <option value="RAPPEL">Rappel (avant echeance)</option>
            <option value="RELANCE">Relance (apres echeance)</option>
          </select>
        </label>

        <label>
          Montant (FCFA)
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>

        <label>
          Date
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Envoi en cours...' : 'Envoyer le message'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-box">
          <div className="result-row">
            <strong>Canal effectif :</strong> {result.effectiveChannel}
            {result.requestedChannel === 'WHATSAPP' && result.effectiveChannel === 'SMS' && (
              <span className="muted"> (repli depuis WhatsApp)</span>
            )}
          </div>
          <div className="result-row">
            <strong>Statut :</strong> <StatusBadge status={result.status} />
          </div>
          {result.simulated && <p className="muted">Mode simulation WhatsApp actif (aucun envoi reel effectue).</p>}
          {result.fallbackReason && <p className="muted">Raison du repli : {result.fallbackReason}</p>}
        </div>
      )}
    </section>
  );
}
