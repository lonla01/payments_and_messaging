import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import PaymentTest from './pages/PaymentTest.jsx';
import MessageTest from './pages/MessageTest.jsx';
import History from './pages/History.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Banc de test — Paiements &amp; Messagerie</h1>
        <nav className="app-nav">
          <NavLink to="/paiement" className={({ isActive }) => (isActive ? 'active' : '')}>
            Paiement
          </NavLink>
          <NavLink to="/message" className={({ isActive }) => (isActive ? 'active' : '')}>
            Message
          </NavLink>
          <NavLink to="/historique" className={({ isActive }) => (isActive ? 'active' : '')}>
            Historique
          </NavLink>
        </nav>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/paiement" replace />} />
          <Route path="/paiement" element={<PaymentTest />} />
          <Route path="/message" element={<MessageTest />} />
          <Route path="/historique" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}
