# Rivnova — Frontend Agent Instructions

Applies to `frontend/`. Product/UI name: **Rivnova**. Existing repository paths and .NET namespaces may still say `FarmFlow`; do not rename them without approval.

## Sources of Truth

Read before coding:
1. `docs/scope.md` — P0/P1/P2 feature scope and exclusions.
2. `frontend/docs/design.md` — approved stack, screens, colors and UX.
3. `docs/api.md` — API contract; verify examples against actual backend DTOs.
4. `frontend/docs/architecture.md` — Feature-Sliced Design (FSD) boundaries.
5. `frontend/docs/work-plan.md` — implementation ownership.
6. `docs/product.md` — product behavior, data quality, demo scenarios.
7. `docs/git-workflow.md` — branches, commits and PR policy.

If documents conflict, follow approved P0 scope and `frontend/docs/design.md`; report remaining contract conflicts. Do not invent features.

## Actual Repository State (verified 2026-11-13)

- Branch `frontend` currently contains docs, logos, UI mockups, ESLint/Prettier and a minimal `frontend/package.json`. It has **no `frontend/src/`, Vite application, or `dev`/`build` scripts** yet.
- Implemented backend exists on **separate branch `backend`**, not in `frontend`: .NET 10 Minimal API, PostgreSQL/PostGIS, Google OAuth with cookie sessions and CSRF, field ownership, four seeded demo fields, NASA analytics and tests.
- Actual backend `GET /api/fields` includes `isDemo` (via `FieldSummaryResponse`), although the example in `docs/api.md` omits it. Use `isDemo`; never classify by field name or hardcoded IDs.
- P1 ONNX predictions and Action Center endpoints are documented but not present in the inspected backend code. Do not build P1/P2 UI without an explicit task.

## MVP Scope

**Exactly 3 pages:**
- `/` — Field Explorer, one page for guest and authenticated states.
- `/fields/:id` — Field Insights for an accessible demo or personal field.
- `/fields/new` — draw/import a GeoJSON Polygon and enter name, crop and planting date.

**Exactly 3 dialogs:** Google Sign-In prompt, Edit Profile, Delete Field confirmation.

- Guests can view/analyze 4 public demo fields without sign-in.
- Signed-in users see Demo Fields + their My Fields and may create/delete only their own fields.
- Guests can draw/import and complete a field draft; Save requires Google Sign-In. Preserve and restore the draft after OAuth redirect.
- No separate login/register/profile pages, extra dashboards, email/password auth, field sharing, teams or organizations.
- Present the most important recommendation first, then reasons, measurements, dates and sources. Clearly label demo fixtures and unavailable data.

## Frontend Architecture

- Stack: React, TypeScript, Vite, TailwindCSS, React Router, TanStack Query, React Leaflet/Leaflet, Leaflet-Geoman, Recharts, FontAwesome.
- FSD folders: `src/app`, `pages`, `widgets`, `features`, `entities`, `shared`; import downward only. Use named exports and slice `index.ts` public APIs.
- Shared HTTP client/config in `shared/api`; typed DTOs/query hooks in relevant slices. Never fetch directly from UI components.
- TanStack Query owns server state; React Router owns route state; use React state/Context for simple UI state. Do not add Zustand, Redux, React Hook Form, Zod, MapLibre or KML just because older architecture notes mention them.
- Keep business rules outside JSX; reuse components/types. Do not edit backend without an explicit task.

## Backend API Integration

- Local backend: `http://localhost:5000`, API docs: `/scalar/v1`. Prefer a same-origin `/api` proxy; for cross-origin fetch use `credentials: 'include'`.
- Auth: `GET /api/auth/me`, `GET /api/auth/google` (browser redirect), `GET /api/auth/csrf`, `POST /api/auth/logout`, `PATCH /api/users/me`. The Google callback is handled server-side.
- Fields: `GET /api/fields`, `POST /api/fields`, `GET /api/fields/{id}`, `DELETE /api/fields/{id}`.
- Analytics: `GET /api/fields/{id}/dashboard`, `/workability`, `/stress`, `/biomass`.
- Send the returned `X-CSRF-TOKEN` header for mutating requests. Never store OAuth tokens, session cookies, or Google client secrets in local storage or frontend code.
- Backend enforces visibility (`IsDemo || OwnerId == currentUserId`). Interpret `401` as sign-in needed, `403` as forbidden/CSRF, `404` as missing/inaccessible. The frontend must not substitute its own authorization logic.
- The backend calculates agronomic decisions, field area and centroid. Do not invent measurements, forecasts or recommendations; handle failures and absent data explicitly.

## Map & Visual Rules

- GeoJSON WGS84 coordinates: `[longitude, latitude]`; Leaflet: `[latitude, longitude]`. Validate Polygon geometry/closed rings before submission. The backend is authoritative for area and centroid.
- Use live Leaflet tiles and interactive GeoJSON polygons, **not static prototype screenshots** for the production map.
- Apply exact colors from `frontend/docs/design.md` (forest `#162A1F`, primary `#24543A`, cream `#F6F1EA`). Helvetica for UI; Righteous 400 for large page headings and display accents.
- Use original SVG assets from `frontend/assets/logos/`; preserve transparency, colors and proportions. `frontend/assets/prototypes/` are visual references only.
- Use FontAwesome. Provide responsive layouts, labeled units, accessible focus states, and loading/empty/error states. Do not show success if a server operation failed. Use concise English demo copy.

## Verification & Git

- Current scripts under `frontend/`: `npm run lint`, `npm run format:check`, `npm run format`. Add and verify `dev`, `build`, and relevant test scripts during Vite setup.
- Run applicable checks after changes. Report actual results and any checks that could not run.
- **Small changes:** Commit directly to the `frontend` branch. This includes configuration, minor UI improvements, small bug fixes, styling adjustments, and documentation.
- **Major changes:** Create a short-lived `feature/*`, `fix/*`, or `refactor/*` branch from `frontend` and open a PR targeting `frontend`. This includes new major features, authentication, API integrations, and architectural changes.
- Keep commits small, focused, and logically grouped. Do not create a separate PR for every minor task.
- Follow the commit convention `[type-frontend] - Description`.
- Never push directly to `main`, `develop`, or `backend`.
- Never merge PRs, force-push, or rewrite shared history without explicit approval.
- Do not commit unrelated changes or modify backend code without an explicit request.
