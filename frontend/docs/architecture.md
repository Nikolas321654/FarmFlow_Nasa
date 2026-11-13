# ARCHITECTURE.md - Frontend

## 0. How to Use This Document

How the frontend code is structured: folders, layers, data flow, geodata, state.
Working rules, code style, UI conventions and the glossary are in the frontend `AGENTS.md`.
If a new architectural decision is made, propose adding it to Section 6.


## 1. Folder Structure

```
src/
├── app/        # providers, router, global styles
├── pages/      # field-explorer, field-insights, add-field
├── widgets/    # application shell and future map/dashboard blocks
├── features/   # user actions and mutations
├── entities/   # field and user data, API queries and types
└── shared/     # api, ui, lib, config
```

### Rules
- Put every new file into the matching folder from this scheme.
- Do not create new top-level folders in `src/` without asking.
- One component per file; file name = component name.


## 2. Layers & Dependencies (FSD)

| Layer       | Purpose                                         | Examples                                       |
|-------------|-------------------------------------------------|------------------------------------------------|
| `app/`      | Providers, router, global styles                | `router.tsx`                                   |
| `pages/`    | Route screens; composition only                 | `map`, `field-details`, `plan`                 |
| `widgets/`  | Large UI blocks combining features & entities   | `field-map`, `field-dashboard`                 |
| `features/` | User actions                                    | `draw-field`, `import-geojson`, `analyze-plan` |
| `entities/` | Domain entities (glossary in `AGENTS.md`)       | `field`, `crop`, `alert`, `planting-plan`      |
| `shared/`   | Reusable code, no domain knowledge              | `api`, `ui`, `lib`, `config`                   |

**Import only downward:** `app → pages → widgets → features → entities → shared`.
No upward imports, no imports between slices of the same layer — move shared code down a layer.

**Slice segments:** `ui/`, `model/` (types, logic), `api/` (query hooks), `lib/`, `index.ts` (public API).
Other slices import **only** via `index.ts`.

### Rules
- No direct `fetch` in components — only hooks from `api/`.
- Business logic lives in pure functions (`model/`, `shared/lib/`), not in JSX.
- `shared/` knows nothing about `Field`, `Crop`, etc.
- Unclear where something belongs — ask.


## 3. Data & API

- HTTP client and base config: `shared/api/`.
- API response types are defined explicitly in the entity's `model/`.
- Do not introduce mock API responses for implemented backend endpoints.
- Thresholds and constants from the spec live in `shared/config/thresholds.ts` — never hardcode them.
- API keys and URLs come from env (`shared/config`), never hardcoded.


## 4. Map & Geodata

- Coordinates: WGS84. **GeoJSON order is always `[lng, lat]`.**
- Leaflet uses `[lat, lng]`; convert coordinates in shared geodata utilities.
- A `Field` is a GeoJSON `Polygon` (closed ring, ≥ 3 points).
- The backend is authoritative for field area and centroid; do not derive persisted values in the frontend.
- GeoJSON import belongs in `features/import-geojson`; validate before saving.
- The map instance lives only in `widgets/field-map`.


## 5. Application State

| State          | Tool                  | Examples                          |
|----------------|-----------------------|-----------------------------------|
| Server         | TanStack Query        | fields, analysis results          |
| URL            | React Router          | selected field id, active tab     |
| Shared UI      | React state/Context   | drawing mode, sidebar open        |
| Local UI       | `useState`            | dropdown open                     |
| Forms          | React state           | create field inputs               |

### Rules
- **Never copy server data into UI state** - read it from the query hook.
- After data mutations, invalidate affected queries. On logout, clear private cached data before refetching public data.
- Do not store derived values (area, statuses) - compute them.


## 6. Decisions & Open Questions

### Decisions
| Date       | Decision                 | Reason                                |
|------------|--------------------------|---------------------------------------|
| 2026-11-04 | FSD architecture         | Clear layers, easy for team & agents  |
| 2026-11-04 | Named exports only       | Safer refactoring, auto-imports       |

### Open questions
- [x] Map library: React Leaflet/Leaflet.
- [x] Field geometry: GeoJSON `Polygon` for the current backend contract.

Do not propose alternatives to listed decisions unless asked.
