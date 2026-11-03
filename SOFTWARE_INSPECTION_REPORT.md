# AI E-Library Software Inspection Report

**Inspection date:** 2026-11-03  
**Scope:** React/Vite client, Django/DRF server, PostgreSQL configuration, MongoDB references, Cloudinary media handling, authentication, APIs, Django Admin, migrations, and local validation.  
**Initial inspection status:** No application fixes were applied during the initial inspection. Security remediation was applied later as a separate, authorized phase. Existing unrelated working-tree changes were not modified.

## Executive summary

The project has a valid Django import path and the frontend production bundle builds, but the deployed/local backend data path is currently not verifiable because the configured PostgreSQL connection fails before migrations can be queried. MongoDB is not an active backend dependency in the current settings; it exists only in commented historical configuration and documentation.

The highest-impact confirmed issues are:

1. Any unauthenticated caller can delete any comment by numeric ID.
2. Deployments without `DJANGO_SECRET_KEY` use a known signing key, allowing JWT forgery.
3. The configured PostgreSQL connection fails with a Supabase tenant/user error, so migrations, books, users, and admin data cannot currently be verified through Django.
4. The frontend activity endpoint sends a client-controlled `demo_user` and the backend accepts unauthenticated activity records.
5. The frontend admin panel reads the already-normalized books array as `res.data`, so the book list can fail to render.
6. Local relative media URLs are not consistently converted to the backend origin, so PDFs/covers can fail when served outside the frontend origin.
7. The frontend and backend have duplicate activity implementations and inconsistent dashboard contracts, which can cause incorrect analytics and makes authorization behavior difficult to reason about.

## Severity summary

| Severity | Confirmed issues |
|---|---:|
| Critical | 0 |
| High | 4 |
| Medium | 8 |
| Low | 4 |

## Confirmed issues

### 1. Unauthenticated deletion of arbitrary comments

- **Severity:** High
- **Evidence:** `server/library/views.py:324-333` decorates `delete_comment` with `AllowAny` and deletes the selected `Comment` without checking authentication, ownership, or staff status.
- **Affected files:** `server/library/views.py`, `server/library/urls.py`, `client/src/components/CommentSection.jsx`
- **Root cause:** The endpoint was intentionally left open (`"allow open delete for now"`), while the data model has no owner foreign key to support an ownership check.
- **Impact:** Any internet user who can guess or enumerate a comment ID can permanently delete another user's review.
- **Recommended remediation:** Require JWT authentication and permit deletion only to the comment author or an administrator. Add a proper user foreign key to comments in a forward migration if ownership must be reliable; do not infer ownership from a client-supplied display name.

### 2. Known fallback Django secret enables JWT forgery

- **Severity:** High
- **Evidence:** `server/config/settings.py:335` uses `django-insecure-dev-key` when `DJANGO_SECRET_KEY` is absent. SimpleJWT uses Django's signing key by default.
- **Affected files:** `server/config/settings.py`
- **Root cause:** Startup does not require a deployment-provided secret and does not reject the development fallback.
- **Impact:** A deployment with the environment variable missing can allow forged access tokens and user impersonation.
- **Recommended remediation:** Fail startup when the secret is missing, too short, or equal to a development value. Rotate the signing key if it may have been used in a reachable deployment; this invalidates existing tokens and should be planned.

### 3. PostgreSQL connection fails before migrations can be inspected

- **Severity:** High
- **Evidence:** `python manage.py showmigrations library` failed with PostgreSQL `OperationalError`: the Supabase pooler returned an `ENOTFOUND tenant/user` error. Runtime settings resolve to PostgreSQL at `aws-0-ap-northeast-1.pooler.supabase.com:5432`, database `postgres`.
- **Affected files:** `server/config/settings.py:472-479`, `server/.env` (local configuration), `server/build.sh`
- **Root cause:** The active `DATABASE_URL` credentials/tenant mapping are not accepted by the configured Supabase pooler. The Render build script runs `python manage.py migrate`, so deployment can fail before the application starts.
- **Impact:** Django cannot currently query books, users, categories, comments, or migration state in this environment. Admin login and API retrieval cannot be verified against the configured database. Existing records were not changed.
- **Recommended remediation:** Replace the invalid deployment connection string with the current provider-generated URL, verify pooler mode/port and SSL requirements, then run migrations and a read-only data inventory. Keep credentials only in deployment secrets, never in source or reports.

### 4. Activity tracking accepts forged user identity and is unauthenticated

- **Severity:** High
- **Evidence:** The active URL imports the second `track_activity` definition at `server/library/views.py:348-369`. It uses `AllowAny`, accepts `request.data['user']`, defaults to `demo_user`, and writes counters/logs. The client sends `{ event, user: "demo_user" }` at `client/src/services/api.js:248`.
- **Affected files:** `server/library/views.py:347-369`, `server/library/urls.py:16`, `client/src/services/api.js:246-253`
- **Root cause:** An earlier authenticated implementation at `server/library/views.py:161-190` is overwritten by a later duplicate function. The client/server contract was changed to a caller-supplied identity rather than deriving identity from `request.user`.
- **Impact:** Anyone can inflate or attribute PDF, AI, bookmark, and comment metrics to any username, pollute analytics, and create unbounded activity rows.
- **Recommended remediation:** Keep one implementation, require authentication for personal events, derive the user identifier from `request.user`, validate event types, and add throttling/rate limits. If anonymous aggregate metrics are required, store them separately without accepting arbitrary user identities.

### 5. Admin panel uses the wrong return shape

- **Severity:** High
- **Evidence:** `apiService.getBooks()` returns a normalized array at `client/src/services/api.js:59-77`, but `client/src/pages/AdminPanel.jsx:23` calls `setBooks(res.data)`. The component later calls `books.map(...)`.
- **Affected files:** `client/src/services/api.js`, `client/src/pages/AdminPanel.jsx`
- **Root cause:** The service abstraction hides the Axios response, while the admin page still assumes a raw response object.
- **Impact:** The admin book table receives `undefined` and can fail during rendering; books uploaded in Django Admin may exist in the API but appear absent in the frontend admin view.
- **Recommended remediation:** Consume the normalized array directly, and add an admin-page smoke test for the empty, paginated, and populated responses.

### 6. Relative media URLs are not consistently resolved to the backend

- **Severity:** High
- **Evidence:** The serializer returns either a storage URL or a relative URL (`server/library/serializers.py:63-82`). The service maps `book.cover_image` and `book.pdf` directly at `client/src/services/api.js:67-68`, while only `BookCard.jsx:12` calls `getFullUrl`. `BookDetail.jsx` uses `book.coverImage` and `book.pdfUrl` directly.
- **Affected files:** `server/library/serializers.py`, `client/src/services/api.js`, `client/src/components/BookCard.jsx`, `client/src/pages/BookDetail.jsx`, `client/src/pages/AdminPanel.jsx`
- **Root cause:** URL normalization is applied in one component but not at the API boundary or all consumers.
- **Impact:** Local/Django media paths such as `/media/...` resolve against the Vercel/frontend origin instead of Django. Covers and PDF links can 404 even when the database record and file are present. Cloudinary absolute URLs work, which makes the issue environment-dependent.
- **Recommended remediation:** Normalize media URLs once in the service layer (or return absolute URLs from the serializer using the request context) and use the normalized fields everywhere. Verify both Cloudinary and local-storage records.

### 7. Duplicate backend definitions create inconsistent authorization and contracts

- **Severity:** Medium
- **Evidence:** `server/library/views.py` defines `track_activity` twice (`161` and `348`) and defines both `DashboardAPIView` (`96`) and `dashboard_stats` (`372`). The URL routes use the later function, not the class-based dashboard.
- **Affected files:** `server/library/views.py`, `server/library/urls.py`
- **Root cause:** Earlier implementations were appended instead of removed or migrated.
- **Impact:** Fixes applied to the first implementation have no effect on live routes. The unused authenticated dashboard returns a different shape and behavior than the public `dashboard_stats` endpoint, increasing regression and security risk.
- **Recommended remediation:** Consolidate each endpoint into one implementation, document its response schema, and add route-level tests that assert permissions and response keys.

### 8. Dashboard data is globally readable and not user-specific

- **Severity:** Medium
- **Evidence:** `dashboard_stats` at `server/library/views.py:371-432` is `AllowAny` and aggregates all `UserActivity` and `ActivityLog` records. The frontend labels the result as personal/user analytics.
- **Affected files:** `server/library/views.py`, `server/library/urls.py`, `client/src/pages/Dashboard.jsx`
- **Root cause:** The authenticated `DashboardAPIView` is not wired into the URL; the public legacy dashboard remains active.
- **Impact:** Anonymous users can read global usage metrics and activity identities. Users see global totals rather than their own activity, contrary to the UI wording.
- **Recommended remediation:** Route `/api/dashboard/` to one authenticated implementation and filter all user activity by `request.user`. Decide explicitly whether any aggregate metrics should be public.

### 9. Admin frontend route is not role-protected

- **Severity:** Medium
- **Evidence:** `client/src/App.jsx:35` exposes `/admin` inside `ProtectedRoute`, which checks only `isAuthenticated`. The backend correctly uses `IsAdminUser` for book writes, but the frontend does not check staff/superuser status.
- **Affected files:** `client/src/App.jsx`, `client/src/components/ProtectedRoute.jsx`, `server/library/views.py:218-228`
- **Root cause:** The UI comment acknowledges that role checking is not implemented.
- **Impact:** Every logged-in user can access an admin-looking screen, see management controls, and receive avoidable 403 requests when attempting writes. This is not a backend privilege escalation, but it is a broken authorization UX.
- **Recommended remediation:** Return staff status in the authenticated user response or add a user endpoint, gate the route in the client for UX, and retain backend `IsAdminUser` as the authoritative control.

### 10. Bookmark state is split between local optimistic state and server state

- **Severity:** Medium
- **Evidence:** `client/src/store/bookmarkStore.js` persists full book objects locally. `apiService.getBookmarks()` returns only IDs, but no initialization path hydrates the store from that endpoint. Add/remove failures are swallowed in `client/src/services/api.js:190-219`.
- **Affected files:** `client/src/store/bookmarkStore.js`, `client/src/services/api.js`, `client/src/pages/Bookmarks.jsx`, `client/src/components/BookCard.jsx`
- **Root cause:** The local store and REST bookmark collection are treated as separate sources of truth.
- **Impact:** Bookmarks can disappear or remain stale across devices, login changes, or failed API calls. The user can see a success toast even when the server rejected the operation.
- **Recommended remediation:** Hydrate bookmarks after authentication, use server records as the source of truth, scope/clear state on user changes, and revert optimistic updates on failed mutations. Do not silently convert API failures into success-shaped results.

### 11. Bookmark activity is double-counted

- **Severity:** Medium
- **Evidence:** `apiService.addBookmark()` calls `trackActivity('bookmark')` at `client/src/services/api.js:201`; `BookCard.jsx:24` and `BookDetail.jsx:67` call `trackActivity('bookmark')` again.
- **Affected files:** `client/src/services/api.js`, `client/src/components/BookCard.jsx`, `client/src/pages/BookDetail.jsx`
- **Root cause:** Activity ownership is split between the service mutation and UI handlers.
- **Impact:** One bookmark action can increment analytics twice (and, with the current anonymous endpoint, twice under `demo_user`).
- **Recommended remediation:** Emit the event in exactly one layer, preferably after a successful server mutation, and test one action produces one log/counter increment.

### 12. Authentication input handling and error responses are weak

- **Severity:** Medium
- **Evidence:** `SignupAPIView` and `LoginAPIView` convert passwords with `.strip()` and catch broad exceptions, returning `str(e)` in API responses (`server/library/views.py:30-87`).
- **Affected files:** `server/library/views.py`
- **Root cause:** Authentication uses hand-written parsing instead of serializers and exposes internal exception text.
- **Impact:** Leading/trailing password characters are silently changed; unexpected database or provider errors can leak implementation details. Signup does not explicitly call Django password validators before creating the user.
- **Recommended remediation:** Use serializers for validation, preserve the submitted password exactly, call `validate_password`, return generic client-safe errors, and log exception details only server-side.

### 13. PDF/file configuration has two competing storage fields

- **Severity:** Medium
- **Evidence:** `Book` stores both `pdf_file` using `RawMediaCloudinaryStorage` and a separate `pdf_url` (`server/library/models.py:23-30`); the serializer chooses `pdf_file` first. The admin also exposes both fields.
- **Affected files:** `server/library/models.py`, `server/library/admin.py`, `server/library/serializers.py`, migration `0007_auto_20260426_1940.py`
- **Root cause:** The project supports uploaded and externally linked PDFs without a single canonical media contract.
- **Impact:** A stale/broken uploaded field can mask a valid external URL; an admin user can populate conflicting fields and produce confusing read behavior. Missing Cloudinary credentials can make admin uploads fail.
- **Recommended remediation:** Define and document precedence, validate that at least one source is usable, surface storage errors in admin/API diagnostics, and add tests for uploaded-only, URL-only, both, and missing-file cases.

### 14. MongoDB Atlas is documented but not active

- **Severity:** Medium
- **Evidence:** Current settings configure `dj_database_url` and PostgreSQL at `server/config/settings.py:472-479`. MongoDB/Djongo configuration is commented historical code in `server/config/settings.py:103-110` and `160-166`; `MONGODB_URI` is not configured in the inspected environment. `README.md` still describes PostgreSQL/MongoDB as the application database.
- **Affected files:** `server/config/settings.py`, `README.md`, `server/requirements.txt`
- **Root cause:** The data architecture changed to PostgreSQL without removing stale MongoDB documentation/configuration.
- **Impact:** Operators may provision or troubleshoot the wrong database. There is no active MongoDB synchronization or consistency mechanism to inspect.
- **Recommended remediation:** Choose PostgreSQL as the authoritative database (recommended for the current Django migrations) and update documentation/configuration, or perform a deliberate migration to a supported MongoDB approach. Do not claim MongoDB consistency until an active adapter and tests exist.

### 15. AI endpoint is public and lacks abuse controls

- **Severity:** Medium
- **Evidence:** `ask_ai` is `AllowAny` at `server/library/views.py:277-287`, calls an external provider, and has no authentication, throttling, request-length limit, or per-user quota.
- **Affected files:** `server/library/views.py`, `server/library/groq_service.py`, `client/src/services/api.js`
- **Root cause:** The AI endpoint was designed as a public convenience endpoint.
- **Impact:** Automated callers can incur provider costs, consume worker capacity, and submit very large prompts. The endpoint also performs database book matching for every request.
- **Recommended remediation:** Add DRF throttling and input limits; require authentication if AI usage is user-account functionality; record usage against the authenticated user; keep provider errors generic to clients.

### 16. Frontend lint is failing

- **Severity:** Low
- **Evidence:** `npm run lint` fails with four `no-useless-escape` errors in `client/src/components/AIChat.jsx:92,96,100` and one missing-hook-dependency warning in `client/src/components/CommentSection.jsx:22`.
- **Affected files:** `client/src/components/AIChat.jsx`, `client/src/components/CommentSection.jsx`
- **Root cause:** Regexes contain unnecessary escapes and `fetchComments` is recreated while omitted from the effect dependency list.
- **Impact:** CI configured to treat lint errors as failures will reject the frontend. The hook warning can become a stale-effect bug if the function later captures changing state.
- **Recommended remediation:** Correct the regex literals and stabilize/include the comments fetch callback.

### 17. Production frontend bundle is oversized

- **Severity:** Low
- **Evidence:** `npm run build` succeeds but reports a minified JavaScript chunk of approximately 1,005 kB, above the 500 kB warning threshold.
- **Affected files:** Vite build output and client dependency graph.
- **Root cause:** The application imports several large UI/3D/chart libraries into the initial bundle without route/component splitting.
- **Impact:** Slower first load, especially on mobile or cold sessions.
- **Recommended remediation:** Lazy-load routes and heavy AI/chart/3D components and measure the resulting bundle.

### 18. Source contains stale credential-like historical configuration

- **Severity:** Low (upgrade to High if any value was active or reused)
- **Evidence:** Commented historical settings include a credential-like literal in `server/config/settings.py:200`, and old MongoDB connection material appears in commented settings around `160-166`. Actual values are intentionally omitted from this report.
- **Affected files:** `server/config/settings.py`
- **Root cause:** Old experiments were commented out rather than removed and rotated.
- **Impact:** Anyone with repository access can recover the values from source history/file contents. Reuse elsewhere could allow third-party access.
- **Recommended remediation:** Remove stale credential material from source and history according to the repository's secret-rotation process, rotate any value that was ever active, and use secret scanning in CI.

## Potential risks requiring environment or data verification

These items could not be fully confirmed without a working database and deployment credentials:

1. **Book existence and media integrity:** The repository contains local media files, but the failed PostgreSQL connection prevented a database inventory mapping each `Book` row to a stored PDF, cover, and audio object.
2. **Admin login:** Django's admin URL and model registration are present, but database authentication cannot be tested until PostgreSQL connectivity is repaired.
3. **Migration completeness in the deployed database:** Migration files `0001` through `0007` exist, but `showmigrations` could not read applied state.
4. **Cloudinary object availability:** The serializer defensively catches storage URL failures, but no live Cloudinary check was performed. A record can still point to a deleted object or stale public ID.
5. **Authenticated PDF reading:** Public book retrieval and media links are implemented, but end-to-end authenticated retrieval/read verification is blocked by the database connection. PDF links are currently not restricted to authenticated users.
6. **CORS/CSRF deployment behavior:** The configured allowlists include known local and Vercel origins, but the actual deployed frontend origin, proxy headers, and browser preflight behavior were not exercised.
7. **Production routing:** Render and Vercel services could not be contacted as part of this local inspection, so deployed 401/404 behavior and media delivery remain unverified.

## Database and storage assessment

- **Active relational database:** PostgreSQL via `dj_database_url`; no active MongoDB adapter is configured.
- **Observed connection:** Host resolution succeeded, but PostgreSQL rejected the configured tenant/user. This is a configuration/connectivity failure, not evidence that records were deleted.
- **Migrations:** Present through `0007_auto_20260426_1940.py`; applied status is unknown because the connection failed.
- **PDF storage:** `pdf_file` uses Cloudinary raw storage; `pdf_url` is an external fallback. The API exposes both under multiple aliases (`pdf`, `pdf_url`, `pdf_file`).
- **Covers/audio:** Model file fields use the configured default Cloudinary storage, with URL fallbacks. Frontend URL normalization is inconsistent.
- **Data preservation:** No delete, reset, migration, import, sync, or database write command was run during this inspection.

## Validation performed

| Check | Result |
|---|---|
| `python manage.py check` | Passed: no Django system-check issues |
| `python -m compileall -q config library` | Passed |
| `python manage.py showmigrations library` | Blocked by PostgreSQL `OperationalError` from the configured Supabase connection |
| `npm run build` | Passed; emitted large-chunk warning |
| `npm run lint` | Failed: 4 errors and 1 warning in the files listed above |
| Git diff/status | Existing modifications were detected in `client/src/services/api.js`, `server/library/groq_service.py`, `server/library/models.py`, `server/library/serializers.py`, plus untracked import/sync scripts. They were not changed. |
| API/database integration tests | Not available in the repository; live API verification was blocked by database connectivity |

## Recommended remediation order

1. Repair and rotate database/deployment credentials; verify migrations and inventory data read-only.
2. Remove the known Django secret fallback and rotate any potentially exposed signing/third-party credentials.
3. Fix comment deletion authorization and consolidate duplicate activity/dashboard endpoints.
4. Make activity and dashboard data authenticated and user-scoped.
5. Normalize media URLs at one boundary and verify Cloudinary/local PDF records.
6. Fix the admin page response-shape bug and add staff-aware route UX.
7. Reconcile bookmark state with the server and remove duplicate activity emission.
8. Add backend/API tests for authentication, permissions, book retrieval, media URLs, uploads, search, bookmarks, comments, and dashboard contracts.
9. Resolve frontend lint failures, then consider code splitting for the bundle warning.

## Inspection conclusion

The application is not ready for a reliable end-to-end “books uploaded in Django Admin appear in dashboard/search and can be read” claim. The API and serializer paths are present, and the frontend build succeeds, but several unaddressed contract, media, and analytics defects still require remediation. The security issues listed in the remediation update below have been fixed and validated.

## Security remediation update

The following confirmed security issues were remediated after the initial inspection:

- Removed the known insecure Django secret fallback. Production startup now fails with `ImproperlyConfigured` when `DJANGO_SECRET_KEY` is missing, too short, or uses a known development value. Explicit local development/test commands may use an ephemeral generated key when debugging is enabled.
- Secured comment deletion with authentication. A comment can now be deleted only by the username recorded as its author or by a staff administrator.
- Consolidated activity tracking into one authenticated implementation. The endpoint accepts the existing `event` payload for frontend compatibility, but always derives `user_identifier` from `request.user` and rejects invalid event types or anonymous requests.
- No migration was required: the current `Comment` schema already stores the author username in `user_name`. A future schema-level ownership foreign key remains advisable, but was intentionally not introduced in this phase.

### Security remediation validation

- `python manage.py check`: passed with a temporary test secret.
- `python manage.py test library.tests`: passed, 7 tests.
- Missing production secret check: failed safely with `ImproperlyConfigured`.
- Known development secret check: failed safely with `ImproperlyConfigured`.
- PostgreSQL configuration path retains `sslmode=require`; security tests used an isolated in-memory SQLite database and did not touch Supabase records.

The remaining findings in this report were not changed in this phase.

## Book and PDF integration update

The following book/media findings were remediated:

- The admin panel now consumes the normalized array returned by `apiService.getBooks()` instead of reading a nonexistent `.data` property.
- Book normalization is centralized in `client/src/services/api.js`. Absolute Cloudinary URLs are preserved, while `/media/` and other relative paths are resolved against the configured backend origin. Cover, PDF, and audio aliases now use the same normalized values across the app.
- `BookCard`, `BookDetail`, and the admin inventory view consume normalized cover/PDF fields. The Book Detail PDF link therefore opens an uploaded Django Admin file or its configured external fallback without changing authentication or book read permissions.
- The backend serializer explicitly prefers a readable uploaded `pdf_file` URL and falls back to `pdf_url` when storage is missing or raises an access error. Blank external URLs are treated as unavailable.
- Public list and search API tests verify that category data and PDF fields for an admin-created book are returned.

### Book/PDF validation

- `python manage.py check`: passed.
- `python manage.py test library.tests`: passed, 10 tests.
- `npm run build`: passed; the existing large-bundle warning remains.
- Read-only PostgreSQL verification found 16 books; all 16 have a PDF file field, an explicit PDF URL, and a cover source. No records were changed.
- No migrations were created or run. No books, files, users, or database records were modified.

Bookmarks and dashboard analytics were intentionally not changed in this phase.
