# FarmFlow NASA — REST API Specification

> **Base URL (Local Development):** `http://localhost:5000`
> **Interactive OpenAPI UI (Scalar):** `http://localhost:5000/scalar/v1`
> **Content-Type:** `application/json` (UTF-8)
> **Spatial Coordinates Standard:** GeoJSON (`RFC 7946`, WGS 84 / SRID `4326`). Note that GeoJSON coordinate tuples follow `[longitude, latitude]` order, while explicit scalar fields (`centroidLat`, `centroidLon`) are labeled explicitly for frontend convenience.

---

## 1. Enumerations & Shared Conventions

### `CropType`
`"Wheat"` | `"Corn"` | `"Sunflower"` | `"Soy"`

### `WorkabilityStatus`
- `"Optimal"` (🟢 Safe for machinery and spraying)
- `"Marginal"` (🟡 Elevated surface moisture; machinery traction caution)
- `"Blocked"` (🔴 High soil compaction or agrochemical washout risk)

### `AlertSeverity`
`"Critical"` | `"Warning"` | `"Info"`

### `AlertType`
`"EarlyWaterStress"` | `"SmartIrrigation"` | `"SprayingBlocked"` | `"BiomassAnomaly"` | `"Predictive72hStress"`

---

## 2. Field Management Endpoints (`Features/Fields`)

### 2.1 `GET /api/fields`
Returns the catalog of all fields with summary status badges so the map sidebar and polygon borders can render immediately (`P0-1`, `P0-2`).

#### Response `200 OK`
```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Field #1 — Central Wheat",
    "cropType": "Wheat",
    "plantedAt": "2026-09-05",
    "areaHectares": 142.8,
    "centroidLat": 48.4512,
    "centroidLon": 31.1824,
    "workabilityStatus": "Optimal",
    "hasActiveStressAlert": false,
    "hasBiomassAnomaly": false,
    "boundary": {
      "type": "Polygon",
      "coordinates": [
        [
          [31.175, 48.448],
          [31.190, 48.448],
          [31.190, 48.455],
          [31.175, 48.455],
          [31.175, 48.448]
        ]
      ]
    }
  }
]
```

---

### 2.2 `POST /api/fields`
Creates a new field from an interactive map polygon or uploaded GeoJSON (`P0-1`). The backend automatically computes `areaHectares` and the geographic centroid (`centroidLat`, `centroidLon`).

#### Request Body
```json
{
  "name": "Field #5 — South Valley",
  "cropType": "Corn",
  "plantedAt": "2026-05-10",
  "boundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [30.512, 49.210],
        [30.528, 49.210],
        [30.528, 49.222],
        [30.512, 49.222],
        [30.512, 49.210]
      ]
    ]
  }
}
```

#### Response `201 Created`
Returns the created field object (same schema as `GET /api/fields/{id}`).

---

### 2.3 `GET /api/fields/{id}`
Returns metadata and geometry for a single field.

#### Response `200 OK`
Same object structure as an item in `GET /api/fields`. Returns `404 Not Found` if `id` does not exist.

---

### 2.4 `DELETE /api/fields/{id}`
Deletes a field from the catalog.

#### Response `204 No Content`

---

## 3. Agro Analytics & Satellite Monitoring (`Features/AgroAnalytics`)

### 3.1 `GET /api/fields/{id}/dashboard`
Unified endpoint returning the 14–30 day NASA satellite time-series (`P0-3`), all 4 deterministic agronomic evaluations (`P0-5` to `P0-8`), and sustainability impact KPIs (`P2-2`) in a single request.

#### Query Parameters
- `days` (optional, `int`, default `14`, max `30`): Number of historical days to include in `timeSeries`.

#### Response `200 OK`
```json
{
  "fieldId": "22222222-2222-2222-2222-222222222222",
  "fieldName": "Field #2 — North Corn",
  "cropType": "Corn",
  "areaHectares": 96.4,
  "dataSource": "NASA_POWER_LIVE",
  "lastUpdatedUtc": "2026-11-09T00:00:00Z",
  "currentMetrics": {
    "precipitationMm24h": 0.4,
    "accumulatedPrecipitationMm30d": 28.5,
    "surfaceSoilMoisture": 0.21,
    "rootzoneSoilMoisture": 0.19,
    "solarRadiation": 16.8,
    "ndvi": 0.74,
    "evaporativeStressIndex": 0.32
  },
  "workability": {
    "status": "Optimal",
    "sprayingSafe": true,
    "rainLast12hMm": 0.0,
    "rainLast24hMm": 0.4,
    "rainForecast24hMm": 1.2,
    "surfaceMoisture": 0.21,
    "recommendation": "Soil bearing capacity is optimal and washout risk is low. Safe for machinery and fertilizer/pesticide application."
  },
  "stressAndIrrigation": {
    "waterDeficitIndex": 0.758,
    "isHiddenStressDetected": true,
    "severity": "Warning",
    "irrigationRecommended": true,
    "recommendedIrrigationMm": 22.0,
    "recommendedWindowHours": 36,
    "recommendation": "Warning: Hidden water stress detected (WDI 0.76 while NDVI remains stable at 0.74). Recommended irrigation of 22 mm within 36 hours to prevent turgor loss."
  },
  "biomass": {
    "currentNdvi": 0.74,
    "ndvi14DayAvg": 0.75,
    "deltaNdvi": -0.01,
    "deltaPercent": -1.3,
    "isAnomalyDetected": false,
    "recommendation": "Biomass growth trajectory is within normal seasonal bounds."
  },
  "impactMetrics": {
    "estimatedWaterSavedM3PerHa": 65.0,
    "preventedRunoffRisk": true,
    "earlyWarningLeadTimeDays": 4
  },
  "timeSeries": [
    {
      "date": "2026-10-27",
      "precipitationMm": 3.2,
      "surfaceMoisture": 0.31,
      "rootzoneMoisture": 0.38,
      "solarRadiation": 14.2,
      "ndvi": 0.76,
      "esi": 0.61
    },
    {
      "date": "2026-10-28",
      "precipitationMm": 0.0,
      "surfaceMoisture": 0.28,
      "rootzoneMoisture": 0.35,
      "solarRadiation": 15.9,
      "ndvi": 0.75,
      "esi": 0.54
    }
  ]
}
```

---

### 3.2 `GET /api/fields/{id}/workability`
Focused endpoint for the **Field Workability Window & Spraying Advisor** (`P0-6`).

#### Response `200 OK`
```json
{
  "fieldId": "33333333-3333-3333-3333-333333333333",
  "status": "Blocked",
  "sprayingSafe": false,
  "rainLast12hMm": 11.4,
  "rainLast24hMm": 14.2,
  "rainForecast24hMm": 6.8,
  "surfaceMoisture": 0.44,
  "forecast48h": [
    { "period": "Today", "status": "Blocked", "reason": "11.4 mm rain in last 12h + surface moisture 0.44" },
    { "period": "Next 24h", "status": "Blocked", "reason": "6.8 mm precipitation forecast (chemical washout risk)" },
    { "period": "24h–48h", "status": "Marginal", "reason": "Surface drying in progress; high wheel slip risk" }
  ],
  "recommendation": "Blocked: High risk of nitrogen/fungicide washout and topsoil compaction by heavy machinery."
}
```

---

### 3.3 `GET /api/fields/{id}/stress`
Focused endpoint for **Early Thermal & Stress Detection + Smart Irrigation Calculator** (`P0-5`, `P0-7`).

#### Response `200 OK`
```json
{
  "fieldId": "22222222-2222-2222-2222-222222222222",
  "waterDeficitIndex": 0.758,
  "threshold": 0.65,
  "rootzoneMoisture": 0.19,
  "cropTargetMoisture": 0.55,
  "evaporativeStressIndex": 0.32,
  "ndviCurrent": 0.74,
  "isHiddenStressDetected": true,
  "irrigationRecommended": true,
  "recommendedIrrigationMm": 22.0,
  "recommendedWindowHours": 36,
  "recommendation": "Field #2: Recommended irrigation dose of 22 mm within 36 hours to prevent turgor loss."
}
```

---

### 3.4 `GET /api/fields/{id}/biomass`
Focused endpoint for the **Vegetation Anomaly Scout** (`P0-8`).

#### Response `200 OK`
```json
{
  "fieldId": "44444444-4444-4444-4444-444444444444",
  "currentNdvi": 0.58,
  "ndvi14DayAvg": 0.71,
  "deltaNdvi": -0.13,
  "deltaPercent": -18.3,
  "rootzoneMoisture": 0.46,
  "isDroughtPresent": false,
  "isAnomalyDetected": true,
  "recommendation": "Field #4: Biomass index dropped by 18.3% while soil moisture is optimal (0.46). Potential localized pest, disease, or weed outbreak — scout inspection required."
}
```

---

## 4. AI/ML & Deep Learning Predictions (`Features/Predictions`)

### 4.1 `GET /api/fields/{id}/predictions/soil-forecast`
Runs in-process inference on the **PyTorch LSTM / 1D-CNN ONNX model** (`soil_forecast.onnx`) using the past 14 days of NASA observations to forecast the next 7 days of rootzone moisture and evapotranspiration (`P1-1`), and computes the **72-hour proactive stress warning** (`P1-2`).

#### Response `200 OK`
```json
{
  "fieldId": "11111111-1111-1111-1111-111111111111",
  "modelName": "soil_forecast_lstm_v1.onnx",
  "proactive72hStressWarning": true,
  "forecastedDay3WaterDeficitIndex": 0.69,
  "proactiveRecommendation": "AI Forecast Warning: Rootzone moisture is projected to drop to 0.22 in 72 hours (WDI 0.69). Schedule preventive irrigation within 48 hours.",
  "forecastSeries": [
    {
      "date": "2026-11-10",
      "dayOffset": 1,
      "predictedRootzoneMoisture": 0.27,
      "predictedEsi": 0.44,
      "predictedWaterDeficitIndex": 0.662
    },
    {
      "date": "2026-11-11",
      "dayOffset": 2,
      "predictedRootzoneMoisture": 0.24,
      "predictedEsi": 0.40,
      "predictedWaterDeficitIndex": 0.696
    },
    {
      "date": "2026-11-12",
      "dayOffset": 3,
      "predictedRootzoneMoisture": 0.22,
      "predictedEsi": 0.38,
      "predictedWaterDeficitIndex": 0.716
    }
  ]
}
```

---

### 4.2 `GET /api/fields/{id}/predictions/yield`
Runs in-process inference on the **Tabular ML ONNX Regressor** (`yield_model.onnx`) to estimate end-of-season harvest yield based on seasonal precipitation, soil moisture, peak NDVI, and stress day count (`P1-3`).

#### Response `200 OK`
```json
{
  "fieldId": "11111111-1111-1111-1111-111111111111",
  "cropType": "Wheat",
  "modelName": "yield_model_rf_v1.onnx",
  "predictedYieldTonsPerHa": 5.84,
  "estimatedTotalHarvestTons": 833.95,
  "regionalBaselineTonsPerHa": 5.20,
  "deltaVsBaselinePercent": 12.3,
  "featuresUsed": {
    "accumulatedPrecipMm30d": 42.0,
    "avgRootzoneMoisture30d": 0.41,
    "peakNdvi30d": 0.79,
    "stressDaysCount30d": 1
  }
}
```

---

## 5. Prioritized Alerts & Feedback Loop (`Features/Alerts`)

### 5.1 `GET /api/alerts`
Returns all active task cards and warnings across all fields, sorted by severity (`Critical` $\rightarrow$ `Warning` $\rightarrow$ `Info`) for the main Action Center (`P1-4`).

#### Response `200 OK`
```json
[
  {
    "id": "a1111111-1111-1111-1111-111111111111",
    "fieldId": "22222222-2222-2222-2222-222222222222",
    "fieldName": "Field #2 — North Corn",
    "alertType": "SmartIrrigation",
    "severity": "Critical",
    "title": "Hidden Water Stress — Preventive Irrigation Needed",
    "message": "Field #2: Recommended irrigation dose of 22 mm within 36 hours to prevent turgor loss.",
    "createdAtUtc": "2026-11-09T01:00:00Z",
    "userFeedbackAccurate": null
  },
  {
    "id": "a2222222-2222-2222-2222-222222222222",
    "fieldId": "44444444-4444-4444-4444-444444444444",
    "fieldName": "Field #4 — East Sunflower",
    "alertType": "BiomassAnomaly",
    "severity": "Warning",
    "title": "Localized Biomass Drop (-18.3%)",
    "message": "Field #4: NDVI dropped by 18.3% while soil moisture is optimal. Dispatch field scout to check for pests or disease.",
    "createdAtUtc": "2026-11-09T01:00:00Z",
    "userFeedbackAccurate": null
  }
]
```

---

### 5.2 `POST /api/alerts/{id}/feedback`
Records farmer confirmation or dismissal of an alert (*"Was this warning accurate? Yes / No"*, `P2-1`).

#### Request Body
```json
{
  "fieldId": "22222222-2222-2222-2222-222222222222",
  "alertType": "SmartIrrigation",
  "isAccurate": true,
  "comment": "Confirmed dry rootzone at 30cm depth."
}
```

#### Response `200 OK`
```json
{
  "feedbackId": "f9999999-9999-9999-9999-999999999999",
  "recordedAtUtc": "2026-11-09T02:20:00Z"
}
```
