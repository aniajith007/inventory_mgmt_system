<<<<<<< HEAD
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
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> 4839c07 (complete inventory mgmt with middleware and db scripts and ionic frontend)
