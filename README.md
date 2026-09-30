# 1MinuteShop — Backend API

A multi-tenant e-commerce backend that lets anyone spin up their own online store under a subdomain (e.g. `mystore.laso.la`), manage products and inventory, and receive orders with manual/screenshot-based payment confirmation.

Built with **Hono** (a lightweight, fast web framework) on **Node.js**, backed by **PostgreSQL** via **Prisma ORM**, with image/file storage on **Supabase Storage**.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)

## Overview

1MinuteShop is a multi-tenant storefront platform. Each **Store Owner** registers an account and is automatically assigned a unique subdomain (derived from their store name, e.g. `Coffee Corner` → `coffeecorner.laso.la`). From there, a store owner can:

- Manage a product catalog (create, update, delete, toggle active/inactive, adjust stock)
- Receive and manage customer orders (order status, payment status)
- Upload product images and payment screenshots to cloud storage
- Configure store settings (currency, tax, shipping, branding — via the `StoreSettings` model)

Customers checkout without needing an account — they submit their contact details, a shipping address, and a **payment screenshot** (used for manual payment verification, common for bank transfer / mobile wallet payments) when placing an order.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM, TypeScript) |
| Web framework | [Hono](https://hono.dev/) with `@hono/node-server` |
| Database | PostgreSQL |
| ORM | Prisma (`@prisma/client`, `@prisma/adapter-pg`) |
| File storage | Supabase Storage (`@supabase/supabase-js`) |
| Auth | JWT (access + refresh tokens) via `jsonwebtoken`, passwords hashed with `bcrypt` |
| Validation | Zod schemas |
| Dev tooling | `tsx` (watch mode), `tsc` (build) |

## Architecture

The codebase follows a classic layered architecture:

```
Routes  →  Controllers  →  Services  →  Repositories  →  Prisma / Database
   ↓            ↓               ↓             ↓
 Hono       HTTP I/O,      Business       Data access
 wiring     req/res         logic         (Prisma queries)
```

- **Routes** (`src/routes`) — define URL paths and HTTP methods, wire them to controllers.
- **Controllers** (`src/controllers`) — parse the Hono `Context`, call the relevant service, shape the HTTP response.
- **Services** (`src/services`) — business logic: validation rules, orchestration across repositories, token generation, etc.
- **Repositories** (`src/repositories`) — the only layer that talks to Prisma/the database.
- **Validators** (`src/validators`) — Zod schemas used as Hono middleware to validate request bodies before they reach controllers.
- **Middlewares** (`src/middlewares`) — cross-cutting concerns: JWT auth guard, centralized error handling.
- **Types** (`src/types`) — shared TypeScript DTOs/interfaces per domain.

Cross-cutting request handling lives in `src/index.ts`: CORS (with dynamic origin matching for `*.laso.la` and `*.localhost:3000` subdomains), request logging, and a global error handler, before mounting the whole API under `/api`.

## Project Structure

```
src/
├── index.ts                  # App entrypoint: CORS, logging, error handling, server bootstrap
├── controllers/               # HTTP request/response handling
│   ├── storeOwner.controller.ts
│   ├── store.controller.ts
│   ├── product.controller.ts
│   ├── order.controller.ts
│   ├── customer.controller.ts
│   └── imageUpload.controller.ts
├── services/                  # Business logic
├── repositories/              # Prisma data access
├── routes/                    # Route definitions, mounted under /api
├── middlewares/
│   ├── auth.middleware.ts     # JWT Bearer token guard
│   └── errorHandler.ts        # Global error → JSON response
├── validators/                # Zod request validation schemas
├── types/                     # Shared TypeScript types/DTOs
└── generated/prisma/          # Generated Prisma client

prisma/
└── schema.prisma              # Database schema (source of truth for the data model)
```

## Data Model

Defined in `prisma/schema.prisma`, PostgreSQL via Prisma:

- **StoreOwner** — a tenant/merchant account. Has a unique `storeName`, `email`, and an auto-generated `storeSubdomain`/`storeUrl`. Status: `ACTIVE | INACTIVE | SUSPENDED`.
- **Product** — belongs to a `StoreOwner`. Has price, stock quantity, active flag, image URL.
- **Customer** — a shopper, identified by unique email/phone. Not tied to a specific store (can order from multiple stores).
- **Order** — belongs to a store (`storeOwnerId` + `storeSubdomain`) and a `Customer`. Tracks `orderStatus` (`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`, or `CANCELLED`) and `paymentStatus` (`PENDING | RECEIVED | FAILED`) independently. Requires a `paymentScreenshotUrl` and full shipping address fields. Order numbers auto-increment per store (unique on `[storeSubdomain, orderNumber]`).
- **OrderItem** — line items for an order, snapshotting `unitPrice` and `quantity` at time of purchase.
- **StoreSettings** — one-to-one store configuration: currency, tax percentage, shipping cost/toggle, branding (logo/banner), contact info.
- **Category** — store-scoped product categories.
- **ProductReview** — customer ratings/reviews on products, with an approval flag.
- **ActivityLog** — audit trail of actions per store (`actionType`, `entityType`, `userType`).
- **RefreshToken** / **Token** — persisted JWT refresh and access tokens (allows server-side revocation/logout).

## Authentication

- Store owners authenticate via **email + password** (`POST /api/store-owners/login`), receiving a short-lived-ish **access token** (30 days) and a **refresh token** (180 days), both JWTs.
- Both tokens are persisted server-side (`RefreshToken` / `Token` tables) so they can be revoked on logout.
- Protected routes are guarded by `authMiddleware` (`src/middlewares/auth.middleware.ts`), which expects:
  ```
  Authorization: Bearer <accessToken>
  ```
- `POST /api/store-owners/refresh` exchanges a valid refresh token for a new access token.
- Passwords are hashed with `bcrypt` before storage; plaintext passwords are never persisted or returned.
- Customers do not authenticate — checkout is guest-based, identified by email/phone.

## API Reference

All routes are mounted under `/api`.

### Store Owners — `/api/store-owners`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | – | Register a new store owner; auto-generates a unique subdomain/URL |
| POST | `/login` | – | Login, returns access + refresh tokens |
| POST | `/refresh` | – | Exchange refresh token for a new access token |
| POST | `/logout` | ✅ | Revoke all refresh tokens for the account |
| GET | `/me` | ✅ | Get the authenticated store owner's profile |
| GET | `/:id` | – | Get a store owner's public profile by ID |
| GET | `/storeData/:subDomain` | – | Get store data by subdomain |
| POST | `/verify-subdomain` | – | Check whether a subdomain exists |

### Stores — `/api/stores`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/check-subdomain` | – | Check subdomain availability |

### Products — `/api/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/store/:storeOwnerId` | – | Create a product for a store |
| GET | `/store/:storeOwnerId` | – | List all products for a store (owner view) |
| GET | `/subdomain/:subdomain` | – | List all products for a store by public subdomain |
| GET | `/search` | – | Search products |
| GET | `/:productId` | – | Get a single product |
| PATCH | `/:productId/store/:storeOwnerId` | – | Update a product |
| DELETE | `/:productId/store/:storeOwnerId` | – | Delete a product |
| PATCH | `/:productId/status` | – | Toggle a product's active/inactive status |
| PATCH | `/:productId/stock` | – | Adjust stock quantity |

### Orders — `/api/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | – | Create an order (validates store, products, stock, computes total) |
| GET | `/` | – | List all orders |
| GET | `/:id` | – | Get orders for a store owner |
| PATCH | `/:id/status` | – | Update order status |
| PATCH | `/:id/payment-status` | – | Update payment status |

### Customers — `/api/customers`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | – | Create a customer |
| GET | `/` | – | List all customers |

### Uploads — `/api/upload`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/image` | – | Upload a product image (base64, ≤10MB; JPEG/PNG/WEBP/AVIF) to Supabase Storage |
| DELETE | `/image` | – | Delete a product image |
| POST | `/payment-screenshot` | – | Upload a payment screenshot for an order |
| DELETE | `/payment-screenshot` | – | Delete a payment screenshot |

> Note: several routes above are currently unauthenticated at the route-definition level even where the underlying operation is store-scoped (e.g. product mutations, order status updates). Ownership is checked in the service layer (comparing `storeOwnerId`), but adding `authMiddleware` to these routes is recommended for defense-in-depth before production use.

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database
- A Supabase project (for image/file storage)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env   # or create .env manually — see below
```

```bash
# 3. Generate the Prisma client and apply the schema
npx prisma generate
npx prisma migrate dev
```

```bash
# 4. Run the dev server (auto-reload via tsx)
npm run dev
```

The API will be available at `http://localhost:8080` (or `PORT` if set), with a health check at `GET /`.

### Building for production

```bash
npm run build   # compiles TypeScript to ./dist
npm run start   # runs the compiled output
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled, used by Prisma at runtime) |
| `DIRECT_URL` | Direct PostgreSQL connection string (used by Prisma for migrations) |
| `JWT_SECRET` | Secret used to sign/verify access tokens |
| `JWT_REFRESH_SECRET` | Secret used to sign/verify refresh tokens |
| `FRONTEND_URL` | Primary allowed CORS origin for the frontend |
| `BACKEND_URL` | Public URL of this backend |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side storage operations) |
| `PORT` | Port the server listens on (defaults to `8080`) |

CORS is configured to automatically allow:
- `FRONTEND_URL` and `http://localhost:3000`
- `https://laso.la` and any `https://<subdomain>.laso.la` (production store subdomains)
- Any `http://<subdomain>.localhost:3000` (local store subdomain testing)

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server with hot-reload (`tsx watch`) |
| `npm run build` | Type-check and compile to `./dist` (`tsc`) |
| `npm run start` | Run the compiled production build (`node dist/index.js`) |
