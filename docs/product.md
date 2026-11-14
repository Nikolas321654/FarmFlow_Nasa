# FarmFlow Product Context

This document describes FarmFlow's users and user experience. See [scope.md](scope.md)
for approved features and exclusions, [api.md](api.md) for contracts and terminology,
and [frontend architecture](../frontend/docs/architecture.md) for implementation guidance.

## 1. Product Overview

FarmFlow is a field-monitoring web app that turns NASA Earth-observation data and
agronomic analysis into practical, field-specific recommendations. It helps a farmer
decide whether to irrigate, work or spray a field, and whether signs of water stress
or unusual vegetation decline call for attention.

Show the recommended action first, then its reason, supporting evidence, observation
date, and limitations. Farmers should not have to interpret satellite indices to
understand what to do next.

## 2. Target Users & Problems

- **Farmers and farm managers** monitor several fields and need clear priorities,
  timing, and quantities for daily decisions.
- **Agronomists and advisors** investigate field health and need trends, underlying
  measurements, field context, and uncertainty.

Weather, soil, and vegetation signals are scattered and hard to turn into an action.
FarmFlow brings them together so users can respond to water needs, fieldwork risks,
and crop-health changes in time.

## 3. User Journeys

### Monitor and select fields

1. Open the workspace without signing in.
2. Compare fields in a catalog and on a map with field boundaries.
   Each field shows its name, crop, area, and current indications.
3. Select a field from either view; the map and catalog stay synchronized.
4. Open its details to see the leading recommendation and supporting analysis.

The four seeded Ukrainian fields should be distinguishable without requiring users
to know agricultural abbreviations.

### Add a field

1. Choose **Add field**, then draw a polygon or upload GeoJSON.
2. Enter a name, crop, and planting date; review the boundary and calculated area
   and centroid before saving.
3. After a successful save, find the field in both the catalog and map.

Explain invalid or unsupported geometry in plain language. Never show a successful
save when persistence failed.

### Understand a field and decide what to do

1. Start with the most important recommendation, its severity, timing, and a short reason.
2. Review current conditions and 14–30 days of precipitation, soil moisture,
   vegetation, and water-stress trends when available.
3. Review irrigation advice, workability and spraying guidance, early water stress,
   and vegetation anomalies that warrant scouting.
4. Check when the observations were updated and whether they are live, preprocessed,
   or demo data.

Use meaningful labels and units. Explain a `Blocked` status.

## 4. Screens & UX

- **Fields Overview / Map:** Compare fields and select one for details.
- **Field Details / Dashboard:** Show the action, reasons, trends, and data provenance.
- **Create Field:** Draw or import a boundary, review field details, and save.
- **Action Center and Predictions:** The backend provides prioritized alerts
  (`GET /api/alerts`), a 7-day soil moisture forecast and a yield estimate
  (`/api/fields/{id}/predictions/*`). The frontend does not show them yet. When it
  does, label forecasts and estimates clearly and keep them separate from observations.

The suggested desktop layout is a field list, map, and context panel. A separate
details page remains an option. On mobile, keep the map usable and place details
in a drawer or sheet if mobile is in scope. Visual references are not finalized screens.

Across screens, present information in this order: action and timing; field and
reason; supporting measurements and trends; data source, freshness, and limitations.

- Provide loading, empty, error, and unavailable-data states for data-driven views.
- Do not treat missing, stale, or failed measurements as `Optimal` by default.
- Communicate status with text, icon, and color, never color alone.
- Use concise English for the hackathon demo. Explain NDVI and ESI when shown;
  avoid raw data-field names in user-facing copy.
- Show only actions that are implemented; a button must not imply work was completed
  when it was not.

## 5. Demo Scenarios

Use the same four situations across the map, field cards, charts, and demo story:

- **`optimal`:** Healthy or acceptable conditions show normal monitoring without
  an urgent intervention.
- **`water_stress`:** Declining rootzone moisture and ESI despite apparently healthy
  vegetation demonstrate an early warning and irrigation recommendation.
- **`rain_blocked`:** Recent or forecast rain demonstrates why fieldwork or spraying
  should be restricted.
- **`pest_anomaly`:** Vegetation decline without a matching drought signal prompts
  scouting for a possible cause; it is not a pest or disease diagnosis.

Use consistent readings across each scenario. Label fixtures as demo data.

## 6. Essential Data Quality Rules

- Workability describes conditions for field operations; crop-health alerts are
  separate. Spraying guidance is also a distinct signal, not an inference from
  workability status alone.
- Historical observations and future predictions must be clearly distinguished.
  Show the source and observation date where known; never present a fixture as live.
- If data or a capability is unavailable, say so. Do not invent measurements,
  forecasts, confidence scores, or savings.
- A vegetation anomaly calls for field scouting. Do not present it as a diagnosis,
  guarantee spraying safety, or promise a yield outcome.
- Recommendations should remain conditional on local practice and field checks.
  The backend owns agronomic calculations and decisions; the UI presents their
  results without creating its own advice.

## 7. Open Questions

- Should Field Details be a page, a side panel, or both?
- Which four Ukrainian locations, crops, and field boundaries are approved for demo?
- Is a mobile experience required for the pitch or a later improvement?
- What exact labels distinguish live, preprocessed, and fixture-based readings?
- Which visual reference, if any, is the finalized design?
- Is the Rivnova crop-rotation and planting-plan concept intended for FarmFlow?
  It is absent from the approved [scope.md](scope.md); do not merge the flows without approval there.