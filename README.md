# Inventory Audit API

Express.js API scaffolded with `express-generator`, secured using JWT auth, role guards, and MSSQL.

## Roles
- `super_admin`
- `admin`
- `user`

## Modules
- Auth (`/api/auth`)
- User Master (`/api/users`)
- Part Master hierarchy (`/api/master`): warehouse -> location -> part/batch rows
- Transaction entries (`/api/transactions`)

## Data Model (Simplified)
- `warehouses`
- `locations`
- `users`
- `part_master` (flat rows: warehouse + location + part_number + batch_no + quantity)
- `audit_transactions` (flat rows: warehouse + location + part_number + batch_no + system/count/variance)

## Quick Start
1. Copy `.env.example` to `.env` and set DB/JWT values.
2. Run SQL bootstrap from `sql/init.sql`.
3. Install dependencies:
   - `npm install`
4. Start API:
   - `npm run dev`

## Default Seed Login
- `superadmin` / `1234`
- `admin1` / `1234`
- `user1` / `1234`

## Important Endpoints

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users (super_admin/admin)
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`

### Master
- `GET /api/master/warehouses`
- `POST /api/master/warehouses` (super_admin/admin)
- `GET /api/master/locations`
- `POST /api/master/locations` (super_admin/admin)
- `GET /api/master/parts`
- `POST /api/master/parts` (super_admin/admin)
- `GET /api/master/parts/:partId/batches`
- `POST /api/master/parts/:partId/batches` (super_admin/admin)

### Transactions
- `POST /api/transactions/submit`
- `GET /api/transactions`
- `GET /api/transactions/:id`
