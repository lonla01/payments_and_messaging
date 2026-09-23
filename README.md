# Prototype — Paiements Mobile Money (CinetPay) + Messagerie WhatsApp/SMS (Twilio)

Banc de test destine a valider techniquement, avant integration dans le service de
gestion locative :

1. L'initiation d'un paiement Orange Money / MTN Mobile Money via **CinetPay** et la
   reception de la confirmation via webhook.
2. L'envoi d'un message (rappel / relance) via **Twilio**, en WhatsApp avec repli
   automatique sur SMS.

## Choix d'architecture

- **Backend : Node.js + Express.** Les deux integrations passent par des SDKs/API REST
  officiels bien documentes en JavaScript (SDK `twilio`, API REST CinetPay via `axios`).
  Garder le meme langage que le frontend React simplifie le prototype (un seul
  ecosysteme, un seul gestionnaire de paquets) sans compromis sur la qualite des
  integrations.
- **Stockage : SQLite** (`better-sqlite3`), decide avec l'utilisateur pour ce prototype
  plutot qu'un fichier JSON — permet des requetes structurees et se rapproche de ce que
  sera la base du service final.
- **Frontend : React + Vite**, sans build natif, responsive, utilisable depuis un
  navigateur mobile.

Le frontend ne detient aucune cle API : tous les appels CinetPay/Twilio passent par le
backend.

## Structure

```
paiements/
  backend/    Express + SQLite, endpoints /payments, /messages, /webhooks
  frontend/   React + Vite, 3 ecrans (Paiement, Message, Historique)
```

## Prerequis

- Node.js 20+ et npm
- Un compte CinetPay (cles API + site_id) et un compte Twilio (Account SID + cle API
  restreinte + Messaging Service) pour les tests d'integration reels — voir plus bas.

## Lancer le backend

```bash
cd backend
npm install
cp .env.example .env
# renseigner .env (voir section "Variables d'environnement")
npm run dev
```

Le serveur demarre sur `http://localhost:4000`. Une base SQLite est creee
automatiquement dans `backend/data/prototype.db` (ignoree par git).

## Lancer le frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

L'application est servie sur `http://localhost:5173` (accessible aussi depuis un
telephone sur le meme reseau via l'IP locale affichee par Vite).

## Variables d'environnement necessaires

Voir `backend/.env.example` pour la liste complete et commentee. Points importants :

- **CinetPay** : `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY` (cle
  differente de l'API key, utilisee pour verifier le `x-token` HMAC des webhooks). Ces
  cles doivent m'etre fournies dans `.env` avant de lancer un test d'integration reel —
  elles ne peuvent pas etre devinees.
- **Twilio** : `TWILIO_ACCOUNT_SID` + `TWILIO_API_KEY_SID`/`TWILIO_API_KEY_SECRET` (cle
  API restreinte, jamais l'Auth Token principal) pour les appels sortants,
  `TWILIO_MESSAGING_SERVICE_SID` (pool unique SMS + WhatsApp). `TWILIO_AUTH_TOKEN` est
  optionnel et sert uniquement a verifier la signature des webhooks entrants — le
  laisser vide desactive cette verification en environnement de test.
- **Webhooks** : CinetPay et Twilio doivent pouvoir atteindre votre backend local.
  Utiliser un tunnel (ex. `ngrok http 4000`) et renseigner l'URL publique dans
  `PUBLIC_BASE_URL`.

## Modes degrades prevus pour ne pas bloquer sur des delais externes

- **`WHATSAPP_SIMULATION_MODE=true` (valeur par defaut)** : simule l'envoi WhatsApp
  (statut `SIMULATED`) sans appeler Twilio, pour tester le flux applicatif avant
  l'approbation Meta des templates Utility. Passer a `false` une fois les templates
  approuves et leurs `TWILIO_WHATSAPP_CONTENT_SID_*` renseignes.
- **Repli SMS automatique** : si l'envoi WhatsApp echoue (template non approuve,
  destinataire non opt-in, etc.), le backend retente automatiquement en SMS.
- **Identifiant alphanumerique MTN Cameroun** : necessite un pre-enregistrement Twilio
  Trust Hub (~3 semaines). Tant que `TWILIO_SMS_SENDER_ID_MTN_CM` n'est pas renseigne,
  le backend replie sur `TWILIO_SMS_LONGCODE_FALLBACK` (numero long code international)
  pour ne pas bloquer les tests.

## Endpoints backend

| Methode | Route | Description |
|---|---|---|
| POST | `/payments/initiate` | Initie un paiement CinetPay |
| POST | `/webhooks/cinetpay` | Notification CinetPay (verifiee puis confirmee via l'API de verification) |
| GET | `/payments/:reference/status` | Statut d'un paiement (polling) |
| GET | `/payments/history` | Historique des paiements testes |
| POST | `/messages/send` | Envoie un message (WhatsApp -> repli SMS) |
| POST | `/webhooks/twilio/status` | Accuses de statut Twilio |
| GET | `/messages/history` | Historique des messages testes |

## Limites connues du prototype

- Les valeurs exactes attendues par CinetPay pour forcer directement Orange Money vs
  MTN Mobile Money (`payment_method`) dependent de la configuration du compte marchand
  et sont a reconfirmer avec le support CinetPay une fois les cles reelles obtenues —
  a defaut, l'utilisateur choisit son operateur sur la page de paiement CinetPay.
  Voir le commentaire dans `backend/src/services/cinetpayService.js`.
- La detection d'operateur (Orange/MTN Cameroun) a partir du numero est basee sur des
  plages de prefixes courantes et peut necessiter une mise a jour
  (`backend/src/services/operatorDetection.js`).
- Pas d'authentification ni de gestion multi-utilisateur : usage interne uniquement.
