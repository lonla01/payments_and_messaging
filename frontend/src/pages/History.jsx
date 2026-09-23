import { useEffect, useState } from 'react';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function History() {
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [paymentsRes, messagesRes] = await Promise.all([
      api.get('/payments/history'),
      api.get('/messages/history'),
    ]);
    setPayments(paymentsRes.data);
    setMessages(messagesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="history-header">
        <h2>Historique des tests</h2>
        <button onClick={load} disabled={loading}>
          Rafraichir
        </button>
      </div>

      <h3>Paiements</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Telephone</th>
              <th>Montant</th>
              <th>Canal</th>
              <th>Statut</th>
              <th>Cree le</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Aucun paiement teste pour l'instant.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.reference}>
                <td>{p.reference}</td>
                <td>{p.phone}</td>
                <td>{p.amount} FCFA</td>
                <td>{p.channel}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>{p.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Messages</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Telephone</th>
              <th>Type</th>
              <th>Canal demande</th>
              <th>Canal effectif</th>
              <th>Statut</th>
              <th>Cree le</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Aucun message teste pour l'instant.
                </td>
              </tr>
            )}
            {messages.map((m) => (
              <tr key={m.id}>
                <td>{m.recipientPhone}</td>
                <td>{m.messageType}</td>
                <td>{m.requestedChannel}</td>
                <td>{m.effectiveChannel || '-'}</td>
                <td>
                  <StatusBadge status={m.status} />
                </td>
                <td>{m.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
