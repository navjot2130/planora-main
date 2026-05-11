# Planora

A full-stack productivity app with:
- **Frontend (Vite + React)**
- **Backend (Node/Express + Firebase/Firestore)**

This repository includes an existing static analysis report of module health:
- [`MODULE_HEALTH_REPORT.md`](./MODULE_HEALTH_REPORT.md)

## Project structure

- `frontend/` – React app
- `backend/` – Express API
- `backend/src/`
  - `controllers/` – request handlers
  - `routes/` – API routing
  - `services/` – AI, analytics, email, notifications
  - `middleware/` – auth/authz and error handling
  - `utils/` – validation and helpers

## What the app does (high level)

Based on the repository’s module health report:
- **Authentication & authorization** via Firebase Auth + backend token verification
- **Tasks** (CRUD + “today” view)
- **AI Planner** (Gemini-generated timeline -> persisted tasks)
- **Analytics** (task stats and heuristic motivation)
- **Chat assistant** (conversation + context)
- **Notifications** (reminders persisted; alerting behavior depends on correct timestamp handling)
- **Calendar** (may have due-date normalization issues)
- **Admin** (admin-only endpoints using custom claims)
- **Profile** (work hours/preferences)

## Module health report

See [`MODULE_HEALTH_REPORT.md`](./MODULE_HEALTH_REPORT.md) for:
- Which modules are working end-to-end
- Operational risks (Gemini/Firebase config issues)
- Identified likely bugs (notably Calendar + Notifications)
- Recommended fixes

## Development notes

Because this README is generated from repository inspection (not runtime execution), configuration details such as required environment variables (e.g., Firebase credentials, `GEMINI_API_KEY`) are documented best-effort via the module health report.

## Logs

The repository root includes:
- `backend-server.out.log`
- `backend-server.err.log`

These may contain runtime error details during local development.

