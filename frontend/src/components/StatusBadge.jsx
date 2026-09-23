const STATUS_LABELS = {
  PENDING: 'En attente',
  SUCCEEDED: 'Confirme',
  FAILED: 'Echoue',
  QUEUED: 'Envoye',
  SENT: 'Envoye',
  DELIVERED: 'Livre',
  READ: 'Lu',
  UNDELIVERED: 'Non livre',
  SIMULATED: 'Simule',
};

const STATUS_CLASSES = {
  PENDING: 'badge badge-pending',
  QUEUED: 'badge badge-pending',
  SENT: 'badge badge-pending',
  SUCCEEDED: 'badge badge-success',
  DELIVERED: 'badge badge-success',
  READ: 'badge badge-success',
  FAILED: 'badge badge-error',
  UNDELIVERED: 'badge badge-error',
  SIMULATED: 'badge badge-simulated',
};

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status || 'Inconnu';
  const className = STATUS_CLASSES[status] || 'badge';
  return <span className={className}>{label}</span>;
}
