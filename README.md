# Homestay Nepal — Backend API

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21.2-000000?style=flat&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?style=flat&logo=javascript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![MIT License](https://img.shields.io/badge/MIT%20License-yellow?style=flat)

> Express + Prisma REST API powering HomeStay Nepal, with JWT auth, eSewa payments, background jobs, and a RAG-powered AI travel guide.

The API layer of **HomeStay Nepal**. Exposes REST endpoints for authentication, homestay listings, bookings, reviews, payments, and an AI chat assistant that retrieves from a curated knowledge base of Nepali village culture.

---

## ✨ Features

### Authentication

- **JWT access tokens** — short-lived, sent in the `Authorization` header
- **Refresh tokens** — long-lived, stored as httpOnly signed cookies
- **Token rotation** — refresh tokens are persisted and revocable per session
- **OTP password reset** — time-limited one-time codes
- **Role-based access** — `TRAVELER` and `ADMIN` roles with route guards

### Core Domain

- **Homestays** — full CRUD with village, region, room type, meals, and amenities
- **Bookings** — availability-aware creation with date range and guest count
- **Reviews** — one review per booking, enforcing the completed-stay rule
- **Notifications** — user-scoped alerts for booking and payment events
- **Village guides** — curated cultural knowledge entries

### Payments

- **eSewa ePay v2** — signature generation and status verification
- **Payment references** — stored and reconciled against bookings

### AI Chat Guide

- **RAG retrieval** — cosine similarity search over homestay embeddings
- **Multi-provider embeddings** — Cohere primary, Gemini fallback
- **Multi-provider generation** — Groq and Gemini
- **Session persistence** — multi-turn conversations stored in the database

### Platform

- **Request validation** — Zod schemas validated in middleware
- **Error handling** — centralized handler with consistent JSON responses
- **File uploads** — Cloudinary integration via Multer
- **Background jobs** — BullMQ queues for email delivery and booking expiry
- **Graceful shutdown** — clean disconnect on `SIGINT` and `SIGTERM`
- **Pagination** — reusable pagination helpers

---

## 🛠️ Technologies

| Technology            | Category     | Purpose                                    |
| --------------------- | ------------ | ------------------------------------------ |
| Node.js               | Runtime      | Server environment                          |
| Express 5             | Framework    | Routing and middleware                      |
| JavaScript (ESM)      | Language     | Native modules, no transpile step           |
| Prisma 6              | ORM          | Typed client, migrations, schema            |
| PostgreSQL            | Database     | Primary datastore via Neon                  |
| Zod                   | Validation   | Request schema validation                   |
| jsonwebtoken          | Auth         | Token signing and verification              |
| bcryptjs              | Crypto       | Password hashing                            |
| cookie-parser         | HTTP         | Signed cookie parsing                       |
| BullMQ + ioredis      | Queue        | Background jobs and retries                 |
| Cloudinary            | Storage      | Image hosting and transformation            |
| Multer                | Uploads      | Multipart file handling                     |
| Cohere + Gemini       | AI           | Embeddings for semantic search              |
| Groq SDK              | AI           | Fast chat completion                        |
| nodemailer            | Email        | Transactional email delivery                |
| helmet + cors         | Security     | Headers and cross-origin policy             |
| morgan                | Logging      | HTTP request logging                        |
| zod                   | Validation   | Runtime type checking                       |

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/Bikram-Bk/HomeStay-Nepal.git
cd HomeStay-Nepal/backend
```

### 2. Install dependencies

```bash
npm install
```

`postinstall` runs `prisma generate` automatically, so the client is built for you.

### 3. Configure environment

Create `.env` in this folder:

```env
NODE_ENV=development
PORT=5000

# Required — app refuses to boot without these
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
JWT_SECRET="your-long-random-secret"
COOKIE_SECRET="your-long-random-secret"

ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d

# Frontend origins for CORS
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# eSewa ePay
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET_KEY=your-secret
ESEWA_GATEWAY_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_STATUS_CHECK_URL=https://rc-epay.esewa.com.np/api/epay/transaction/status/

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# AI
GROQ_API_KEY=your-key
COHERE_API_KEY=your-key
GEMINI_API_KEY=your-key

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=HomestayNepal <no-reply@homestaynepal.com>
ADMIN_EMAIL=admin@homestaynepal.com
```

The app exits immediately on startup if `DATABASE_URL`, `JWT_SECRET`, or `COOKIE_SECRET` is missing — fail fast, not at first request.

### 4. Set up the database

```bash
# Apply migrations
npx prisma migrate deploy

# Load demo data
node prisma/seed.js
```

### 5. Start the server

```bash
npm run dev
```

Verify:

```bash
curl http://localhost:5000/health
```

```json
{ "success": true, "message": "ok", "data": { "uptime": 12.34 } }
```

---

## 📜 Available Scripts

| Script      | Command                     | Description                       |
| ----------- | --------------------------- | --------------------------------- |
| Dev         | `npm run dev`               | Watch mode via nodemon            |
| Start       | `npm start`                 | Production server                 |
| Generate    | `npm run prisma:generate`   | Rebuild the Prisma client         |
| Migrate     | `npm run prisma:migrate`    | Apply migrations                  |
| Postinstall | `prisma generate`           | Runs automatically on install     |

---

## 📁 Project Structure

```
prisma/
  schema.prisma           data model, 10 models + 4 enums
  migrations/             versioned SQL migrations
  seed.js                 demo data loader
  seed-vectors.js         RAG embedding indexer
prisma.config.ts         Prisma CLI configuration
config/
  env.js                  env loading + required-var guard
  database.js             Prisma client singleton
  redis.js                ioredis client with graceful degradation
  queue.js                BullMQ queues and workers
  cloudinary.js           upload configuration
routes/                   Express routers, one per domain
controllers/              request handlers
services/                 business logic
middlewares/
  auth.middleware.js      JWT verification
  role.middleware.js      role-based guard
  validate.middleware.js  Zod request validation
  upload.middleware.js    Multer file handling
  error.middleware.js     404 + centralized error handler
validators/               Zod schemas per domain
utils/
  asyncHandler.js         async route wrapper
  jwt.js                  token signing and verification
  tokens.js               access/refresh token factories
  password.js             bcrypt hashing and comparison
  response.js             consistent response helpers
  pagination.js           page and limit handling
  slug.js                 URL slug generation
  lock.js                 concurrency locking
  esewa.js                eSewa signature and verification
rag/
  embeddings.js           multi-provider embedding generation
  retriever.js            cosine similarity search
  prompt.js               prompt construction
app.js                    entry point, middleware chain, shutdown
```

---

## 🗄️ Data Model

Ten models across four domains.

| Model              | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `User`             | Traveler and admin accounts                        |
| `RefreshToken`     | Revocable refresh sessions                         |
| `Homestay`         | Listing with pricing, amenities, and photos        |
| `Booking`          | Stay reservation with payment state                |
| `Review`           | One-per-booking rating                             |
| `Notification`     | User-scoped alerts                                 |
| `ChatSession`      | AI conversation container                          |
| `ChatMessage`      | Individual chat turns                              |
| `HomestayEmbedding`| Vector index for semantic search                   |
| `VillageGuide`     | RAG knowledge base entries                         |

**Enums:** `Role`, `BookingStatus`, `MealOption`, `RoomType`

---

## 🧠 Key Concepts

### Layered architecture

Requests flow `route → controller → service → database`. Routers only declare paths and middleware. Controllers handle HTTP concerns. Services own business logic and are the only layer that touches Prisma. This keeps payment and booking rules testable without spinning up HTTP.

### Graceful Redis degradation

`config/redis.js` never throws on connection failure. If Redis is unreachable, the app logs a warning and continues. Email and booking-expiry jobs will not queue, but the API stays up. Emails are wrapped in `try/catch` for the same reason — a full Redis outage should not take down bookings.

### RAG without pgvector

Embeddings are stored as a plain `Float[]` column. `rag/retriever.js` computes cosine similarity in SQL using `UNNEST ... WITH ORDINALITY`. This keeps the database portable and avoids an extension dependency, at the cost of linear scan performance — acceptable at this data volume.

Cohere is the primary embedding provider. If it falls back to Gemini, embedding dimensions no longer match, so indexing is skipped and search returns empty rather than returning wrong results.

### Token strategy

Access tokens are short-lived and held in `localStorage`. Refresh tokens are long-lived, httpOnly, cookie-protected, and stored in the database so they can be revoked server-side. This gives you logout-everywhere without exposing the long-lived credential to JavaScript.

### Validation at the edge

`validate.middleware.js` runs Zod schemas before controllers. Invalid requests never reach business logic, so services can assume their inputs are already well-formed.

---

## 📡 API Surface

All routes are mounted under `/api`.

| Prefix              | Domain                      |
| ------------------- | --------------------------- |
| `/api/auth`         | Register, login, refresh, reset |
| `/api/homestays`    | Listing discovery           |
| `/api/villages`     | Village guide knowledge     |
| `/api/bookings`     | Booking lifecycle           |
| `/api/contact`      | Contact form                |
| `/api/payments`     | eSewa integration           |
| `/api/reviews`      | Review submission           |
| `/api/notifications`| User alerts                 |
| `/api/uploads`      | Image upload                |
| `/api/chat`         | AI guide                    |
| `/api/admin`        | Admin-only operations       |

---

## 🚢 Deployment

### Render

| Setting            | Value                             |
| ------------------ | --------------------------------- |
| Build command      | `npm install && npx prisma generate` |
| Pre-deploy command | `npx prisma migrate deploy`       |
| Start command      | `npm start`                       |
| Health check path  | `/health`                         |

Set every variable from the `.env` section above in the Render dashboard. There is no `.env` file on the host, so anything not set in the dashboard simply will not exist.

Use the **pooled** Neon connection string in production — the hostname contains `-pooler`.

---

## 📚 Documentation

- [Express Documentation](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [BullMQ Documentation](https://docs.bullmq.io)
- [Zod Documentation](https://zod.dev)
- [Neon Documentation](https://neon.tech/docs)
- [Upstash Redis Documentation](https://docs.upstash.com)
- [eSewa ePay Integration](https://developers.esewa.com.np)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cohere Embeddings](https://docs.cohere.com)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request with a clear description of your changes. If you change a data model, include the matching migration and note whether it is backward compatible.

---

## 🆘 Support

- **GitHub Issues**: https://github.com/Bikram-Bk
- **Email**: bikrambk2244@gmail.com

---

## 📄 License

This project is licensed under the MIT license.

---

Made with ❤️ by Bikram Luhar