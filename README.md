# Roommates — Shared Bill Splitter

Roommates is a full-stack shared-expense application for splitting household bills between members. It provides a responsive dashboard, equal expense splitting, member management, and payment status tracking.

## Features

- Create and view shared household expenses
- Add members to a household
- Split expenses equally between members
- Track paid, unpaid, and outstanding amounts
- View expense categories and payer details
- Add expenses and members through the browser interface
- Currency-formatted amounts in Indian Rupees (`INR`)
- Idempotency-key support for duplicate-payment prevention
- Cloudflare D1 migration and API storage support
- Responsive desktop and mobile layouts

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| Routing | TanStack Router |
| API | Hono |
| Deployment | Cloudflare Workers |
| Database | Cloudflare D1, SQLite |
| Testing | Vitest |
| Linting and formatting | Biome |
| Package manager | pnpm |

## Project Structure

```text
.
├── migrations/                 # D1 database migrations
│   └── 0001_initial.sql
├── src/
│   ├── lib/
│   │   ├── money.ts            # Currency and equal-split helpers
│   │   └── money.test.ts       # Vitest unit tests
│   ├── routes/
│   │   ├── __root.tsx          # Application shell and navigation
│   │   └── index.tsx           # Dashboard and modal workflows
│   ├── main.tsx                # React entry point
│   ├── routeTree.gen.ts        # Generated TanStack Router tree
│   ├── styles.css              # Application styles
│   └── worker.ts               # Hono API running on Cloudflare Workers
├── index.html
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml               # Cloudflare Workers and D1 configuration
```

## Prerequisites

- Node.js 20 or newer
- pnpm
- A Cloudflare account for deployed Worker and D1 usage

## Installation

```bash
pnpm install
```

## Frontend Development

Start the Vite development server:

```bash
pnpm dev
```

Create a production frontend build:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Cloudflare Worker Development

Start the local Worker API:

```bash
pnpm api:dev
```

Apply the initial D1 migration locally:

```bash
pnpm api:migrate
```

## Testing and Quality

Run the Vitest suite:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Run Biome lint and formatting checks:

```bash
pnpm lint
```

Format files:

```bash
pnpm format
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/homes` | Create a home |
| `POST` | `/api/homes/:homeId/members` | Add a member |
| `POST` | `/api/homes/:homeId/expenses` | Create and equally split an expense |
| `POST` | `/api/shares/:shareId/payments` | Record a member payment |
| `GET` | `/api/homes/:homeId/dashboard` | Fetch home, member, and expense data |

Payment requests require an `Idempotency-Key` header. Reusing the same key returns the existing payment instead of creating a duplicate.

## Equal-Split Behavior

Expenses are stored in integer minor units (paise) to avoid floating-point rounding errors. The split algorithm distributes remainder paise deterministically:

```text
₹48.00 split between 4 members = ₹12.00 each
₹1.00 split between 3 members = ₹34.00, ₹33.00, ₹33.00
```

## Currency

All frontend values are formatted for Indian locale conventions using:

- Currency: Indian Rupee (`INR`)
- Locale: `en-IN`

## Security Notes

- Payment requests use an idempotency key
- Remaining balances are checked before accepting payments
- Share payment totals are constrained against the expense share total
- Database foreign keys, amount constraints, and indexes are defined in the migration
- Authentication, authorization, real payment-provider integration, and member identity verification should be added before production deployment

## Current Development Status

The frontend dashboard is functional with local sample data. The Hono API and D1 schema provide backend scaffolding for homes, members, expenses, shares, and payments. Authentication and real-time frontend-to-D1 data synchronization are required for a complete production deployment.
