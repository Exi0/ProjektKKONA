# ProjektKKONA

A full-stack marketplace platform connecting agricultural service providers and clients. Users post listings (*inzeráty*) for agricultural work, express interest, match with each other, negotiate deals, exchange messages in real time, and leave multi-dimensional ratings. Includes email verification, Stripe payments (profile unlocks and premium subscriptions), an admin moderation panel, and saved-search email digests.

> ⚠️ **Note on secrets:** never commit `.env` files. They are listed in `.gitignore`. Use the variables below as a template and keep real values local.

## Tech stack

**Backend** — Node.js, Express, MongoDB (Mongoose), Socket.IO (real-time chat), JWT auth via httpOnly cookies, Stripe, Nodemailer, Multer (uploads), node-cron (scheduled digests), Helmet + express-rate-limit (security).

**Frontend** — React + Vite, React Router, Axios, MUI, Tailwind-style components, Recharts / D3 (dashboards), Leaflet & Google Maps (listing maps), Socket.IO client, React-Toastify.

## Project structure

```
ProjektKKONA/
├── server/            # Express API + Socket.IO
│   ├── controllers/   # Route handlers
│   ├── models/        # Mongoose schemas
│   ├── routes/        # API route definitions
│   ├── middleware/    # userAuth, adminAuth, multer
│   ├── services/      # saved-search matcher, notifications, digests
│   ├── config/        # db, socket, cron, mail, email templates
│   └── server.js      # entry point
└── client/            # React + Vite SPA
    └── src/
        ├── pages/
        ├── components/
        └── context/
```

## Prerequisites

- Node.js 18+ and npm
- A MongoDB database (local or Atlas)
- A Stripe account (for payments)
- An SMTP account (for verification / reset / digest emails)
- A Google Maps API key (for the map views)

## Getting started

### 1. Backend

```bash
cd server
npm install
npm run server   # dev with nodemon (or: npm start)
```

Create `server/.env`:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<dbname>

# Auth
JWT_SECRET=<long-random-string>

# Environment / CORS
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173      # comma-separated for multiple
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000

# Email (SMTP)
SMTP_USER=<smtp-username>
SMTP_PASS=<smtp-password>
SENDER_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUB_PRICE_ID=price_...
```

The server runs on port `4000` by default (override with `PORT`).

### 2. Frontend

```bash
cd client
npm install
npm run dev      # Vite dev server on http://localhost:5173
```

Create `client/.env`:

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
```

### 3. Stripe webhooks (for local payment testing)

Payments are granted server-side via the webhook, not the client. To test locally, forward events with the Stripe CLI:

```bash
stripe listen --forward-to localhost:4000/api/payments/webhook
```

Use the signing secret it prints as `STRIPE_WEBHOOK_SECRET`.

## Available scripts

**Server**
- `npm start` — run with Node
- `npm run server` — run with nodemon (auto-reload)

**Client**
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — ESLint

## API overview

All routes are prefixed with `/api`. Protected routes require the JWT cookie (`userAuth`); admin routes require an admin role (`adminAuth`).

| Prefix | Purpose |
|---|---|
| `/api/auth` | register, login, logout, email verification, password reset |
| `/api/user` | profile, ratings, favorites, verification, subscription status |
| `/api/inzerat` | listings CRUD, interested users, winner selection |
| `/api/image` | image upload / approval |
| `/api/conversation`, `/api/message` | real-time chat |
| `/api/deal` | deal negotiation and completion |
| `/api/payments` | Stripe checkout + webhook |
| `/api/notifications` | in-app notifications |
| `/api/saved-searches` | saved searches + email digests |
| `/api/reports` | user reports (admin) |
| `/api/stats` | dashboard statistics |

## Security notes

- Auth uses httpOnly JWT cookies; passwords are hashed with bcrypt.
- Rate limiting is applied globally, with a stricter limit on `/api/auth`.
- OTP codes are attempt-limited to mitigate brute force.
- Access-control checks enforce resource ownership on mutating endpoints.
- Payments are granted only via the verified Stripe webhook — never trusted from the client.

## License

ISC
