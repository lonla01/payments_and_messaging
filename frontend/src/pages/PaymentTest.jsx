import { useEffect, useRef, useState } from 'react';
import { api, extractErrorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const TERMINAL_STATUSES = ['SUCCEEDED', 'FAILED'];
const POLL_INTERVAL_MS = 4000;

export default function PaymentTest() {
  const [phone, setPhone] = useState('+237690000000');
  const [amount, setAmount] = useState(5000);
  const [channel, setChannel] = useState('ORANGE_MONEY');
  const [reference, setReference] = useState('');

  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  function startPolling(ref) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/${ref}/status`);
        setPayment(data);
        if (TERMINAL_STATUSES.includes(data.status)) {
          clearInterval(pollRef.current);
        }
      } catch (err) {
        console.error('Erreur de polling statut paiement', err);
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setPayment(null);
    clearInterval(pollRef.current);

    try {
      const { data } = await api.post('/payments/initiate', {
        phone,
        amount: Number(amount),
        channel,
        reference: reference || undefined,
      });
      setPayment(data);
      startPolling(data.reference);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h2>Test de paiement Mobile Money</h2>
      <p className="muted">Initie un paiement via CinetPay et suit sa confirmation par webhook.</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Numero de telephone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237690000000" required />
        </label>

        <label>
          Montant (FCFA)
          <input
            type="number"
            min="100"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label>
          Canal
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="MTN_MOBILE_MONEY">MTN Mobile Money</option>
          </select>
        </label>

        <label>
          Reference (optionnel)
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="test-loyer-1" />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Initiation en cours...' : 'Initier le paiement'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {payment && (
        <div className="result-box">
          <div className="result-row">
            <strong>Reference :</strong> {payment.reference}
          </div>
          <div className="result-row">
            <strong>Statut :</strong> <StatusBadge status={payment.status} />
          </div>
          {payment.paymentUrl && (
            <div className="result-row">
              <a href={payment.paymentUrl} target="_blank" rel="noreferrer">
                Ouvrir le lien de paiement CinetPay
              </a>
            </div>
          )}
          {payment.status === 'PENDING' && <p className="muted">En attente de confirmation (webhook CinetPay)...</p>}
        </div>
      )}
    </section>
  );
}
