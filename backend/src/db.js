import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

// Utilise le module SQLite integre a Node.js (disponible depuis Node 22+, sans
// dependance native a compiler) : suffisant pour ce prototype et plus simple a
// installer que better-sqlite3, dont le build echoue sur les toutes dernieres
// versions de Node/V8.
export const db = new DatabaseSync(path.join(dataDir, 'prototype.db'));
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XAF',
    phone TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    payment_url TEXT,
    payment_token TEXT,
    operator_id TEXT,
    raw_check_response TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_phone TEXT NOT NULL,
    requested_channel TEXT NOT NULL,
    effective_channel TEXT,
    message_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    body TEXT,
    twilio_sid TEXT,
    status TEXT NOT NULL DEFAULT 'QUEUED',
    error_code TEXT,
    fallback_reason TEXT,
    simulated INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
