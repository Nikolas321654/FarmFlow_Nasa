# ARCHITECTURE.md - Frontend

## 0. How to Use This Document

How the frontend code is structured: folders, layers, data flow, geodata, state.
Working rules, code style, UI conventions and the glossary are in the frontend `AGENTS.md`.
If a new architectural decision is made, propose adding it to Section 6.


## 1. Folder Structure

```
src/
├── app/        # providers, router, global styles
├── pages/      # map, field-details, plan
├── widgets/    # field-map, field-dashboard
├── features/   # draw-field, import-geojson, analyze-plan
├── entities/   # field, crop, alert, planting-plan
└── shared/     # api, ui, lib (geo, format), config, i18n
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
- Mocks live in `[src/mocks/]` and match real API responses exactly.
- Thresholds and constants from the spec live in `shared/config/thresholds.ts` — never hardcode them.
- API keys and URLs come from env (`shared/config`), never hardcoded.


## 4. Map & Geodata

- Coordinates: WGS84. **GeoJSON order is always `[lng, lat]`.**
- `[If Leaflet: it uses [lat, lng] - convert only in shared/lib/geo/.]`
- A `Field` is a GeoJSON `Polygon` (closed ring, ≥ 3 points).
- Area and centroid only via `shared/lib/geo/` (`getFieldAreaHa`, `getFieldCentroid`); no direct Turf calls in components.
- Import (GeoJSON/KML) only via `features/import-geojson`; validate before saving.
- The map instance lives only in `widgets/field-map`.


## 5. Application State

| State          | Tool                  | Examples                          |
|----------------|-----------------------|-----------------------------------|
| Server         | TanStack Query        | fields, analysis results          |
| URL            | React Router          | selected field id, active tab     |
| Global UI      | Zustand               | drawing mode, sidebar open        |
| Local UI       | `useState`            | dropdown open                     |
| Forms          | React Hook Form + Zod | create field, planting plan       |

### Rules
- **Never copy server data into Zustand or `useState`** - read it from the query hook.
- After mutations, invalidate queries instead of patching data manually.
- Do not store derived values (area, statuses) - compute them.


## 6. Decisions & Open Questions

### Decisions
| Date       | Decision                 | Reason                                |
|------------|--------------------------|---------------------------------------|
| 2026-11-04 | FSD architecture         | Clear layers, easy for team & agents  |
| 2026-11-04 | Named exports only       | Safer refactoring, auto-imports       |

### Open questions
- [ ] Map library: Leaflet or MapLibre?
- [ ] Field geometry: `Polygon` only or `MultiPolygon` too?

Do not propose alternatives to listed decisions unless asked.