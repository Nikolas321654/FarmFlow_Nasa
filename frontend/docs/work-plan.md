# Frontend Work Plan

## Shared Foundation
Owner: TBD
Branch: chore/frontend-scaffold

- React + Vite + TypeScript
- Router and app layout
- API client and shared types
- Theme and reusable UI components
- Consistent mock-data strategy

## Person A. Field Management
Branch: feature/field-management

Owns:
- widgets/field-map
- widgets/field-sidebar
- features/create-field
- features/draw-field
- features/import-geojson

Deliverables:
- Display and select fields on map
- Show synchronized field catalog
- Create fields using polygon or GeoJSON
- Submit name, cropType, plantedAt, boundary

## Person B. Field Analytics
Branch: feature/field-dashboard

Owns:
- widgets/field-dashboard
- entities/agro-analysis
- Dashboard-specific UI components

Deliverables:
- Display field metrics and time series
- Show irrigation recommendations
- Show workability and stress statuses
- Show biomass anomaly information

## Integration Contract

- Field selection uses a shared fieldId.
- Dashboard reads fieldId and loads its own data.
- API types follow docs/api.md.
- Shared files are changed only through agreed PRs.
- Features must work with mock data when API is unavailable.

## Definition of Done

- Feature works end to end
- No TypeScript or lint errors
- Loading/error/empty states handled
- No conflicting API types or duplicate shared components
- PR reviewed before merge

## API Integration Ownership

### Person A. Fields & Map

Responsible for integrating:
- `GET /api/fields`
- `POST /api/fields`
- `GET /api/fields/{id}`
- `DELETE /api/fields/{id}`

### Person B. Field Dashboard & Analytics

Responsible for integrating:
- `GET /api/fields/{id}/dashboard`
- `GET /api/fields/{id}/workability`
- `GET /api/fields/{id}/stress`
- `GET /api/fields/{id}/biomass`

### Shared / Development Only

- `GET /health` — backend health check.
- `GET /api/test/nasa/{scenario}` — diagnostic endpoint for NASA mock scenarios.

These endpoints do not require dedicated UI features.

### Integration Rules

- Person A owns field API integration; Person B may reuse field queries.
- Person B owns analytics API integration.
- Use shared TypeScript types matching backend responses.
- Do not duplicate API hooks or HTTP requests across modules.
- Use `fieldId` to connect field selection with the dashboard.
- Use `docs/api.md` as the planned contract and verify actual responses against the running backend.
- Do not implement P1/P2 endpoints until they are available.