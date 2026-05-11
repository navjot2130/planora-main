# Planora (MERN AI) — Developer Guide

## Overview
Planora is a MERN-style application with:
- **Frontend:** React (Vite)
- **Backend:** Express.js API (Firebase Admin used for auth/user data; see `backend/src/firebase/*`)
- **Deployment:** Vercel serverless (Node)

This guide is written for a new developer inheriting the repository.

---

## Repository layout

### Root
- `package.json` (if used for monorepo tooling)
- `vercel.json` (Vercel routing/build configuration)
- `README.md`

### Backend (`backend/`)
- `backend/api/index.js` — **Vercel serverless entrypoint** (exports the Express app)
- `backend/src/app.js` — builds the Express app (middleware, routes)
- `backend/src/server.js` — local development server (starts `app.listen`)
- `backend/src/routes/*` — route modules
- `backend/src/controllers/*` — request handlers
- `backend/src/middleware/*` — auth + error handling
- `backend/src/firebase/admin.js` — Firebase Admin initialization
- `backend/src/services/*` — AI, analytics, notifications, email, etc.

### Frontend (`frontend/`)
- `frontend/src/api/*` — API client functions calling backend endpoints
- `frontend/src/auth/*` — auth utilities
- `frontend/src/AuthContext.jsx` — auth context

---

## Vercel deployment model

### How Vercel loads the backend
Vercel is configured to route all incoming requests to the serverless entry:
- `vercel.json`
  - build uses: `@vercel/node`
  - entry module: `backend/api/index.js`

Expected behavior:
- `backend/api/index.js` **must export the Express app** in the format Vercel expects.
- Routes must be mounted under the same prefixes used by the frontend (see below).

### Important
If the backend export format is wrong, Vercel will fail with errors like:
> “Invalid export found in module backend/src/app.js. The default export must be a function or server.”

That error is caused by exporting something other than what Vercel expects from the serverless entry.

---

## API routes (what the frontend calls)
Backend mounts routes under `/api/*` in `backend/src/app.js`:
- `GET/POST /api/tasks/...` (tasks)
- `POST /api/planner/...` (planner)
- `GET/POST /api/chat/...` (chat)
- `GET /api/analytics/...` (analytics)
- `GET/POST /api/reminders/...` (reminders)
- `GET/POST /api/profile/...` (profile)
- `GET/PATCH /api/admin/...` (admin)

### Auth
Many routes use `requireAuth` / `requireAdmin` middleware (Firebase ID token verification).

---

## Environment variables
Environment variables are read in the backend from `process.env`.

### Firebase Admin auth
Required for server startup and API calls that require auth:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Note:** `FIREBASE_PRIVATE_KEY` may contain escaped newlines (`\\n`). `backend/src/firebase/admin.js` converts `\\n` into real `\n`.

If these are missing or invalid, Firebase Admin throws errors during initialization.

### CORS
CORS origin is configured in `backend/src/config/cors.js`:
- `CORS_ORIGIN` (optional)
- default fallback is `http://localhost:5173`

For production, set `CORS_ORIGIN` to your deployed frontend URL.

### Rate limiting (optional)
- `RATE_LIMIT_WINDOW_MS` (optional; defaults to 15 minutes)
- `RATE_LIMIT_MAX` (optional; defaults to 200)

### Server port
- `PORT` (optional; defaults to 8080)

---

## Setup (local development)

### 1) Install dependencies
From repo root:
- Backend:
  - `cd backend`
  - `npm install`
- Frontend:
  - `cd frontend`
  - `npm install`

### 2) Configure environment
Create `backend/.env` (if not already present) with the variables listed above.

Minimal example:
```bash
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
```

### 3) Run backend
- `cd backend`
- `npm run dev`

Backend uses `backend/src/server.js` to start `app.listen`.

### 4) Run frontend
- `cd frontend`
- `npm run dev`

---

## Vercel checklist for a new deployment

1. Ensure `vercel.json` points to the correct serverless entry.
2. Ensure the serverless entry exports what Vercel expects.
3. Ensure all required environment variables are configured in Vercel:
   - Firebase Admin variables
   - `CORS_ORIGIN`
   - rate limit variables (optional)
4. Confirm frontend base URL / API client points to the deployed backend.

---

## Common issues

### Vercel “Invalid export found … default export must be a function or server”
- Cause: Vercel is importing a module and the export is not what it expects.
- Fix: Ensure `backend/api/index.js` is the module Vercel builds/runs and that it exports the Express app in the correct format.

### Firebase Admin credential errors
- Cause: missing/invalid service account variables.
- Fix: validate `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

---

## Notes on code organization
- `backend/src/app.js` should only create and configure the Express `app` (middleware, routes). It should not call `app.listen`.
- `backend/src/server.js` is responsible for listening locally.
- Serverless entry should avoid side effects (like starting a listener) and instead export the Express instance.

---

## Current status (repository as received)
- Vercel entrypoint file exists: `backend/api/index.js`
- Root Vercel config exists: `vercel.json`
- Backend export structure needs to be kept aligned with Vercel’s expectations.

When making changes:
- validate locally with `npm run dev`
- validate on Vercel using logs

---

## Quick commands
- Backend dev server: `cd backend && npm run dev`
- Frontend dev server: `cd frontend && npm run dev`


