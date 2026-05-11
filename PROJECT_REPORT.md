# Planora Project Report (MERN AI)

## 1. Goal of this repository
Planora is an AI-assisted MERN-style application:
- **Frontend:** React + Vite
- **Backend:** Express API
- **AI/ML services:** Located in `backend/src/services/ai/*`
- **Auth/DB layer:** Firebase Admin SDK in `backend/src/firebase/*` (Firestore used for data)
- **Deployment:** Vercel using serverless Node runtime.

## 2. High-level system architecture
### Frontend
- Entry: `frontend/index.html` (Vite)
- React router/pages live in `frontend/src/pages/*`
- Shared API client layer lives in `frontend/src/api/*`
- Auth state managed in `frontend/src/auth/AuthContext.jsx`

### Backend
- Entrypoint for serverless: `backend/api/index.js`
- Express application factory/config: `backend/src/app.js`
- Local dev server: `backend/src/server.js`
- Routes: `backend/src/routes/*`
- Controllers: `backend/src/controllers/*`
- Middleware: `backend/src/middleware/*`
- Firebase Admin initialization: `backend/src/firebase/admin.js`

## 3. Backend request flow
1. Client calls an endpoint under `/api/*`.
2. Vercel/serverless loads the Express app from the entry module.
3. Express executes middleware in `backend/src/app.js`:
   - `helmet()`
   - `express.json()`
   - `cors(corsOptions)`
   - `express-rate-limit`
4. Express mounts route modules:
   - `/api/tasks`
   - `/api/planner`
   - `/api/chat`
   - `/api/analytics`
   - `/api/reminders`
   - `/api/profile`
   - `/api/admin`
5. Route handlers delegate to controllers.
6. Controllers call Firebase Admin / Firestore services.
7. Error handling flows through `backend/src/middleware/errorHandler.js`.

## 4. Routing map (based on `backend/src/app.js`)
- `/api/tasks`
  - likely includes `/today`, `GET /`, `POST /`, `PATCH /:taskId`, `DELETE /:taskId`, `POST /:taskId/toggle`
- `/api/planner`
  - `POST /generate`
- `/api/chat`
  - `GET /` recent conversations
  - `GET /history`
  - `POST /message`
- `/api/analytics`
  - analytics endpoints (today/weekly/monthly)
- `/api/reminders`
  - list/create/delete reminders
- `/api/profile`
  - get/update profile
- `/api/admin`
  - list users, update user, system stats
- `GET /health`
  - simple health check

## 5. Middleware map
### Auth
- `backend/src/middleware/auth.js`
  - `requireAuth` verifies Firebase ID tokens from `Authorization: Bearer <token>`
  - sets `req.user = { uid, email }`

- `backend/src/middleware/adminAuth.js`
  - `requireAdmin` for admin-protected routes

### Error handling
- `backend/src/utils/apiError.js`
  - `ApiError` class with `statusCode` and optional `details`

- `backend/src/middleware/errorHandler.js`
  - `notFoundHandler`
  - `errorHandler` which serializes `{ error, details }`

### Async wrapping
- `backend/src/utils/asyncHandler.js`
  - wraps async controllers and forwards errors to Express.

## 6. Data layer & storage
### Firebase Admin
- `backend/src/firebase/admin.js`
  - Initializes firebase-admin (if no apps exist)
  - Builds service account from env vars
  - Exposes:
    - `admin`
    - `db = admin.firestore()`
    - `auth = admin.auth()`

### Firestore usage example
- `backend/src/controllers/tasks.controller.js`
  - queries `db.collection('tasks')`
  - filters by `userId`
  - uses fields like `dueDate`, `completed`, `createdAt`, `updatedAt`

## 7. AI/LLM services
- `backend/src/services/ai/*`
  - `aiService.js`
  - `chatService.js`
  - `plannerService.js`

These services are used by controllers responsible for chat/planning.

## 8. Email/notifications
- `backend/src/services/notifications/emailReminderScheduler.js`
  - local server starts scheduler after `app.listen()`.

## 9. Frontend <-> backend contract
Frontend API calls are organized under `frontend/src/api/*`.
Key expectations:
- Backend base URL must include `/api` prefix.
- Backend CORS must allow the frontend origin.
- Auth headers must be present for protected endpoints.

(Exact endpoint URLs are derived in frontend API client code, particularly `frontend/src/api/apiClient.js`.)

## 10. Deployment setup (Vercel)
### Vercel configuration
- `vercel.json` in repo root configures the build and routing.
- It points Vercel to the serverless entry module:
  - `backend/api/index.js`
  - uses `@vercel/node`

### Serverless requirements
- The serverless entry module must export the Express app in a way Vercel accepts.
- Incorrect exports (or wrong module format) can result in:
  - “Invalid export found … The default export must be a function or server.”

## 11. Current implementation status (important)
This repository has been partially updated to address the Vercel export issue by:
- adding/using `backend/api/index.js` as the Vercel entrypoint,
- updating `vercel.json` accordingly,

However, the project requirements you provided also specify:
- Express backend with **ES Modules**
- `backend/src/app.js` must export **ONLY**: `export default app;`
- No `app.listen()` in `app.js`
- `backend/server.js` contains `app.listen()` only
- `backend/package.json` has `
