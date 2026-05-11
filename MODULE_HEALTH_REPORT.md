# Planora module health report (code-based)

This report is generated from static code inspection of the repository.
It classifies each module/page/API as:
- **Working for real users**: wired to real backend data sources (Firestore) and uses correct request/response shapes.
- **Not working / likely placeholder**: relies on dummy/static values, incomplete backend endpoints, broken client wiring, or UI logic that cannot work end-to-end.

> Note: Runtime errors (missing env vars, Firebase credentials, Gemini API key, admin claims) can make a “working” module fail in practice. Those are listed under “Operational risks”.

---

## 1) Authentication & Authorization (likely required for all modules)
### Frontend auth state (Firebase Web)
- **Status:** Working
- **Evidence:** `frontend/src/auth/AuthContext.jsx` uses Firebase Auth, provides `user`, `getIdToken` via `setAuthTokenGetter`.

### Backend auth middleware
- **Status:** Working
- **Evidence:** `backend/src/middleware/auth.js` verifies Firebase ID token and populates `req.user.uid`.

### Admin authorization guard
- **Status:** Working
- **Evidence:** `backend/src/middleware/adminAuth.js` checks `decoded.admin` claim.

**Operational risks**
- If Firebase custom claims are not set (`admin: true`), `/app/admin` and `/api/admin/*` will fail by design.

---

## 2) Tasks module (CRUD + today view)
### Backend: Tasks API
- **Status:** Working
- **Evidence:**
  - `backend/src/controllers/tasks.controller.js` implements:
    - `GET /api/tasks/today` (filters by `dueDate`==today)
    - `GET /api/tasks` (supports query filters by `priority`, `category`, `status`)
    - `POST /api/tasks` create
    - `PATCH /api/tasks/:taskId` update
    - `DELETE /api/tasks/:taskId` delete
    - `POST /api/tasks/:taskId/toggle` toggle completion
  - Uses `tasks` collection with `userId` scoping.
  - Uses Zod `taskSchema` for validation.

### Frontend: Tasks UI
- **Status:** Working
- **Evidence:** `frontend/src/pages/TasksPage.jsx` uses `tasksApi` for load/create/update/delete/toggle.

**Operational risks**
- `GET /api/tasks/today` currently “fallbacks” to include tasks with no `dueDate` (it returns `true` when `!t.dueDate`). That may be acceptable, but it means “Today’s tasks” may include unscheduled tasks.

---

## 3) Planner module (AI generate + accept -> persisted tasks)
### Backend: Planner generate
- **Status:** Working (with Gemini operational dependency)
- **Evidence:**
  - `backend/src/services/ai/plannerService.js` calls `aiService.generateText` and parses JSON (`normalizeJSON`).
  - Has a robust fallback plan if Gemini fails or JSON parsing fails (`buildFallbackPlan`).

### Backend: Planner accept
- **Status:** Working
- **Evidence:** `backend/src/controllers/planner.controller.js`:
  - Validates `plan.timeline`.
  - Converts timeline blocks into tasks.
  - Persists tasks to Firestore `tasks` collection with `userId`.

### Frontend: Planner UI wiring
- **Status:** Working
- **Evidence:** `frontend/src/pages/PlannerPage.jsx`
  - `plannerApi.generate()` -> renders timeline
  - `plannerApi.accept(acceptedPlan)` -> redirects to `/app/tasks`

**Operational risks (can cause degraded output for real users)**
- If `GEMINI_API_KEY` is missing, planner generation will throw and the service will immediately use fallback plan. This is “working” end-to-end, but the content may be non-user-specific.

---

## 4) Analytics module
### Backend Analytics
- **Status:** Working (real data, but heuristic scoring)
- **Evidence:** `backend/src/services/analytics/analyticsService.js` queries Firestore `tasks` filtered by `userId` and computes metrics.
- **But:** motivation message is static heuristic-based (not a placeholder API response; still computed from real task stats).

### Frontend Analytics UI
- **Status:** Working
- **Evidence:** `frontend/src/pages/AnalyticsPage.jsx` fetches:
  - `analyticsApi.weekly()` and `analyticsApi.monthly()` and renders charts/cards.

**Potential mismatch risk**
- Dashboard relies on `tasksApi.getToday()` and `analyticsApi.today()` and maps `dueDate` into a time string.
- Dashboard code is tolerant to multiple possible analytics shapes, suggesting possible historic mismatch. Current backend `analytics.controller.js` only returns analytics objects without extra wrapper keys; the dashboard’s “tolerant” logic should still work.

---

## 5) Dashboard module
### Frontend Dashboard
- **Status:** Working
- **Evidence:** `frontend/src/pages/DashboardPage.jsx` loads:
  - `tasksApi.getToday()`
  - `analyticsApi.today()`

### Display logic
- **Status:** Working
- **Evidence:** uses computed values, but also provides fallbacks when analytics values are missing.

---

## 6) Chat assistant module
### Backend chat history and messaging
- **Status:** Working (real persistence, but relies on Firestore collection presence)
- **Evidence:** `backend/src/services/ai/chatService.js`:
  - `listRecentConversations` reads from `chats` collection.
  - `sendMessage` creates/loads chat thread from `chats/{chatId}` and writes back `messages`.
  - Includes task context by fetching last 12 tasks for the user.

### Frontend chat UI
- **Status:** Working
- **Evidence:** `frontend/src/pages/ChatPage.jsx` uses `chatApi` and renders conversation history.

**Operational risks / likely issues**
- If `chats` collection has no indexes for `userId` + `updatedAt`, queries may become slow or fail depending on Firestore rules.
- Chat assistant relies on Gemini availability (`GEMINI_API_KEY`). If Gemini fails and `aiService.generateText` throws, users will see errors.

---

## 7) Notifications module (reminders UI)
### Backend reminders endpoints
- **Status:** Working (CRUD only)
- **Evidence:**
  - `backend/src/controllers/reminders.controller.js` implements `GET /api/reminders`, `POST /api/reminders`, `DELETE /api/reminders/:reminderId`.
  - Reminders are persisted in Firestore `reminders` collection.

### Frontend reminders UI
- **Status:** Partially working / UI logic likely incorrect for due reminders
- **Evidence:** `frontend/src/pages/NotificationsPage.jsx`:
  - Loads reminders + pending tasks.
  - Uses a `setInterval` loop that checks:
    - `const at = r.remindAt?.seconds ? r.remindAt.seconds * 1000 : new Date(r.remindAt).getTime();`
    - then `if (at && Math.abs(now - at) < 30000) toast(r.title);`

**Why it may not work reliably for real users**
- Firestore returns Timestamp objects; depending on the client serialization, `r.remindAt` may not match the `.seconds` check. The code attempts to support both Timestamp and string/date, but there is no guaranteed normalization.
- There is no “completed/acknowledged” behavior: reminders will toast every 30s while within the ±30s window unless the UI state prevents duplicates (it doesn’t).
- There is no reminder “lead time” logic (despite `ProfilePage` having `reminderLeadMinutes`), so reminders won’t trigger relative to work hours.

**Overall classification:**
- CRUD works; actual reminder alert behavior is **fragile** and may appear as “static/incorrect behavior” to users.

---

## 8) Calendar module
### Frontend calendar UI
- **Status:** Not working correctly (client-side bug + broken API assumptions)
- **Evidence:** `frontend/src/pages/CalendarPage.jsx`
  - Calls `tasksApi.list({})`.
  - But `tasksApi.list` expects backend filter params and backend `/api/tasks` uses `priority/category/status` query only; passing `{}` is fine.
  - However, the big issue:
    - `tasksForDay(day)` compares `d.toDateString()` against `day.toDateString()`.
    - It derives `d` using:
      - `t.dueDate.seconds ? new Date(t.dueDate.seconds * 1000) : new Date(t.dueDate)`
    - In the `TasksPage` and `DashboardPage`, dueDate is sometimes treated as:
      - Firestore Timestamp object
      - Or a date string
    - But the Calendar UI does **not** handle `dueDate` consistently with other pages (not normalized).

**Additional severe bug**
- `tasksApi.list({})` triggers a request that includes query params; yet `TasksPage` passes params as `{ priority, category, status }` but `list` in `apiClient` usage (from `tasksApi.js`) relies on `apiClient.get('/api/tasks', { params })`. This is fine.
- The calendar still needs reliable dueDate serialization.

**Overall classification:** likely to show wrong/empty scheduled tasks for many users.

---

## 9) Admin module
### Backend admin endpoints
- **Status:** Working (admin-only)
- **Evidence:** `backend/src/controllers/admin.controller.js` implements:
  - `GET /api/admin/users`
  - `PATCH /api/admin/users/:uid`
  - `GET /api/admin/stats`

### Frontend admin UI
- **Status:** Working (if admin claims are set)
- **Evidence:** `frontend/src/pages/AdminPage.jsx` uses `adminApi.users()` and `adminApi.stats()`.

---

## 10) Profile module
### Backend profile endpoints
- **Status:** Working
- **Evidence:** `backend/src/controllers/profile.controller.js` implements:
  - `GET /api/profile`: returns normalized profile with streak
  - `PATCH /api/profile`: validates work hours and merges into Firestore `profiles/{userId}`.

### Frontend profile UI
- **Status:** Working
- **Evidence:** `frontend/src/pages/ProfilePage.jsx` uses profileApi get/update.

---

## 11) Known placeholder/static content
These are not “non-functional” APIs, but places where the UX is likely to feel static because it is not user-personalized.

- **Analytics motivation message**: `motivationalMessage` is a heuristic static string based on productivity thresholds.
- **Planner fallback plan**: if Gemini fails or JSON parsing fails, timeline uses deterministic fallback tasks.
- **Dashboard CTA**: “AI Daily Planner” button routes to planner; not dummy.

---

# Summary table

| Module/Page | Working for real users? | Notes |
|---|---|---|
| Auth (web + backend middleware) | ✅ Yes | Depends on Firebase env + token verification. |
| Tasks (CRUD + today) | ✅ Yes | Filters are real; today view includes tasks without dueDate. |
| AI Planner generate/accept | ✅ Yes | Uses Gemini when configured; otherwise fallback plan (still persisted). |
| Analytics | ✅ Yes | Heuristic metrics derived from real tasks. |
| Dashboard | ✅ Yes | Loads real tasks + analytics. |
| Chat Assistant | ✅ Mostly | Real persistence + context; fails if Gemini fails. |
| Notifications | ⚠️ Partial | Reminder “alerting” is fragile and likely duplicates; lead-time not implemented. |
| Calendar | ❌ No (likely broken) | Due date serialization/normalization is inconsistent; scheduled tasks may not render. |
| Admin | ✅ Yes (admin only) | Requires custom claim. |
| Profile | ✅ Yes | Persists normalized preferences and work hours. |

---

# Recommended next fixes (to make all modules reliably usable)

## A) Calendar module: make it render real due tasks
1. **Fix dueDate parsing on CalendarPage**
   - Add a shared helper to normalize `dueDate` from Firestore Timestamp or ISO/date string:
     - if `dueDate?.toDate` exists => `dueDate.toDate()`
     - else `new Date(dueDate)`
     - else return `null`
   - Compare dates using a “date-only” formatter (e.g., `YYYY-MM-DD`) to avoid timezone drift.
2. **Use consistent API serialization**
   - CalendarPage should treat tasks the same way as TasksPage/DashboardPage (normalize all `dueDate` fields before filtering).

## B) Notifications: make alerts correct + non-duplicating
1. **Normalize remindAt into Date**
   - Replace the `.seconds` heuristic with robust parsing (Timestamp `.toDate` OR `new Date(value)`).
2. **Prevent duplicate toasts**
   - Track fired reminders in memory:
     - key: `reminderId + firedAtWindow` (e.g., minute or 30s bucket)
   - Only toast once per reminder per window.
3. **Actually use Profile lead-time**
   - Fetch reminderLeadMinutes from `/api/profile` and trigger when `now >= remindAt - leadMinutes`.
4. **Optional: respect workHours**
   - If reminder triggers outside workHours, either delay until next workHours-start or suppress.

## C) Planner/Chat operational robustness (Gemini dependency)
1. **Make Gemini failures visible but still usable**
   - Keep current fallback for planner, but also show a UI badge like “AI unavailable, using fallback schedule”.
2. **Chat failure handling**
   - Catch Gemini errors in chatService and return a safe text response instead of throwing.

## D) Data correctness / query performance
1. **Add Firestore indexes**
   - Ensure indexes exist for:
     - `tasks`: (`userId`, `dueDate`, ordering patterns)
     - `chats`: (`userId`, `updatedAt` ordering)
2. **Make “today” definition consistent across modules**
   - Decide whether tasks with `dueDate === null` should be included in “today”. If not, remove the fallback in `getTodaysTasks`.




