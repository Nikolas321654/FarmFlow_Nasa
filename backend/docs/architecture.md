# FarmFlow Backend & AI/ML Architecture

## 1. Overview & Architectural Philosophy

> **Scope Alignment:** This architecture implements the feature tiers (`P0`, `P1`, `P2`) and anti-scope-creep guardrails defined in [docs/scope.md](file:///Users/spnch/documents/code/hackathons/NASA-2026/FarmFlow_Nasa/docs/scope.md).

**FarmFlow** is an agricultural monitoring and decision-support system powered by NASA Earth Science satellite observations (**GPM IMERG, MODIS/VIIRS, ECOSTRESS, SMAP**), deterministic agronomic models, and in-process AI/ML inference.

To maximize development velocity during the hackathon and eliminate merge conflicts between backend developers, the backend uses a **Modular Monolith with Vertical Slice Architecture** built on **.NET 10 Minimal APIs**.

### Key Principles
- **Vertical Slices over Layered (N-Tier) Architecture:** Instead of splitting code horizontally across `Controllers`, `BLL/Services`, `DAL/Repositories`, and `DTO` projects, every feature lives in a self-contained slice under `Features/`. Each endpoint file encapsulates its own request/response records, validation, database queries, and domain calculations.
- **Zero Unnecessary Abstractions:** No `IFieldRepository` or `IFieldService` interfaces for single-implementation logic. Inject `AppDbContext` directly into endpoint handlers.
- **Strategic Abstraction Where It Counts (`INasaClient`):** External satellite APIs are abstracted behind `INasaClient` with a resilient fallback decorator and caching layer so the application never fails or lags during a live demo.
- **In-Process AI/ML Inference via ONNX:** Models are trained in Python (`scikit-learn` + `PyTorch`), exported to `.onnx`, and executed natively inside the .NET process via `Microsoft.ML.OnnxRuntime` with zero microservice/network overhead.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime & Web Framework** | **.NET 10** + **ASP.NET Core Minimal APIs** | High-performance HTTP APIs with minimal ceremony |
| **Database** | **PostgreSQL 16 + PostGIS 3.4** | Relational storage + native spatial types (`Polygon`, `Point`, GeoJSON) |
| **ORM & Spatial Mapping** | **EF Core 10** + `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite` | Direct mapping of PostGIS geometries to `NetTopologySuite` types |
| **GIS / Geometry Engine** | **NetTopologySuite** + `NetTopologySuite.IO.GeoJSON4STJ` | Polygon validation, centroid calculation, and area conversion (hectares) |
| **Caching & Resilience** | `IHttpClientFactory` + `HybridCache` / `IMemoryCache` | Caching NASA coordinate responses and falling back to mock fixtures |
| **AI/ML Inference (.NET)** | `Microsoft.ML.OnnxRuntime` | Running tabular ML and Deep Learning time-series models in-process |
| **AI/ML Training (Python)** | **Python 3.12**, `scikit-learn`, `skl2onnx`, `PyTorch`, `onnx` | Offline model training and `.onnx` artifact generation |
| **API Documentation** | **Scalar (`Scalar.AspNetCore`)** + `.http` files | Interactive OpenAPI testing and team alignment |

---

## 3. Repository & Directory Structure

```text
backend/
├── docs/
│   └── architecture.md                        # This architecture document
├── docker-compose.yml                         # PostgreSQL + PostGIS container setup
├── ml/                                        # Python offline training pipeline
│   ├── pyproject.toml / requirements.txt
│   ├── data/                                  # Historical NASA POWER & AppEEARS training datasets
│   ├── train_yield_model.py                   # Scikit-learn Random Forest / GBDT -> yield_model.onnx
│   └── train_soil_forecast.py                 # PyTorch 1D-CNN / LSTM -> soil_forecast.onnx
└── src/
    └── FarmFlow.Api/
        ├── Program.cs                         # DI registration, middleware, endpoint mapping
        ├── appsettings.json
        ├── Infrastructure/
        │   ├── Database/
        │   │   ├── AppDbContext.cs            # EF Core context with PostGIS configuration
        │   │   ├── DbSeeder.cs                # Pre-seeded demo fields for instant pitch readiness
        │   │   └── Entities/
        │   │       ├── Field.cs               # Polygon, Centroid, AreaHa, CropType, PlantedAt
        │   │       └── AlertFeedback.cs       # Farmer feedback on alerts (Yes/No accuracy)
        │   ├── Spatial/
        │   │   └── GeoCalculator.cs           # NetTopologySuite area (ha) & centroid calculation
        │   ├── Nasa/
        │   │   ├── INasaClient.cs             # Unified satellite data contract
        │   │   ├── NasaModels.cs              # NasaDailyMetric, FieldSatelliteSeries
        │   │   ├── NasaPowerClient.cs         # Live NASA POWER REST client + -999 sanitizer
        │   │   ├── MockNasaClient.cs          # Realistic scenario fixtures for demo stability
        │   │   ├── ResilientNasaClient.cs     # Caching + automatic fallback wrapper
        │   │   └── Fixtures/                  # Pre-extracted JSON fixtures (Healthy, Stress, Pest/Rain)
        │   └── Ml/
        │       ├── OnnxModelRegistry.cs       # Singleton InferenceSession manager
        │       └── Models/
        │           ├── yield_model.onnx       # Tabular yield regressor
        │           └── soil_forecast.onnx     # Deep Learning 7-day soil/ET forecaster
        └── Features/
            ├── Fields/
            │   ├── CreateField.cs             # POST /api/fields (GeoJSON -> Polygon, AreaHa, Centroid)
            │   ├── GetFields.cs               # GET  /api/fields
            │   ├── GetFieldById.cs            # GET  /api/fields/{id}
            │   └── DeleteField.cs             # DELETE /api/fields/{id}
            ├── AgroAnalytics/
            │   ├── AgroFormulas.cs            # Pure static calculation methods for agronomic indices
            │   ├── GetFieldDashboard.cs       # GET  /api/fields/{id}/dashboard (Unified metrics + alerts)
            │   ├── GetWorkabilityWindow.cs    # GET  /api/fields/{id}/workability (48h field & spray status)
            │   ├── GetEarlyStressAlert.cs     # GET  /api/fields/{id}/stress (WDI + Smart Irrigation mm)
            │   └── GetBiomassTrend.cs         # GET  /api/fields/{id}/biomass (NDVI series + anomaly scout)
            ├── Predictions/
            │   ├── PredictYield.cs            # GET  /api/fields/{id}/predictions/yield
            │   └── ForecastSoilMoisture.cs    # GET  /api/fields/{id}/predictions/soil-forecast
            └── Alerts/
                ├── GetActiveAlerts.cs         # GET  /api/alerts (Prioritized action cards across all fields)
                └── SubmitAlertFeedback.cs     # POST /api/alerts/{id}/feedback
```

---

## 4. High-Level System Data Flow

```mermaid
flowchart TD
    UI["Frontend Dashboard (Map + Charts + Action Cards)"]
    API["ASP.NET Core Minimal APIs (Vertical Slices)"]
    DB[("PostgreSQL + PostGIS\n(Fields, Polygons, Feedback)")]
    Resilient["ResilientNasaClient\n(HybridCache + 3s Timeout Fallback)"]
    LiveNASA["NasaPowerClient\n(NASA POWER REST API)"]
    MockNASA["MockNasaClient\n(Pre-extracted AppEEARS / POWER Fixtures)"]
    AgroEngine["Agro Decision Engine\n(Workability, WDI, Irrigation, Biomass)"]
    ONNX["OnnxModelRegistry (Singleton)\n(yield_model.onnx & soil_forecast.onnx)"]

    UI <-->|JSON + GeoJSON| API
    API <-->|EF Core + NetTopologySuite| DB
    API --> Resilient
    Resilient -->|Cache Miss| LiveNASA
    Resilient -.->|Timeout / -999 / Offline Mode| MockNASA
    API --> AgroEngine
    API --> ONNX
    ONNX -.->|7-Day Forecast Feeds Early Stress| AgroEngine
```

---

## 5. Database & Spatial Design (PostGIS)

Using `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite`, spatial columns use SRID `4326` (WGS 84):

### `Field` Entity
- `Id` (`Guid`, PK)
- `Name` (`string`) — e.g., *"Field #2 — North Block"*
- `CropType` (`CropType` enum: `Wheat`, `Corn`, `Sunflower`, `Soy`)
- `PlantedAt` (`DateOnly`)
- `Boundary` (`NetTopologySuite.Geometries.Polygon`, `geometry(Polygon, 4326)`)
- `Centroid` (`NetTopologySuite.Geometries.Point`, `geometry(Point, 4326)`)
- `AreaHectares` (`double`) — computed on creation from `Boundary`
- `DemoScenario` (`string?`) — optional tag (`"optimal"`, `"water_stress"`, `"pest_anomaly"`, `"rain_blocked"`) allowing deterministic demo scenarios for seeded fields while supporting live coordinates for newly drawn fields.

### `AlertFeedback` Entity
- `Id` (`Guid`, PK)
- `FieldId` (`Guid`, FK)
- `AlertType` (`string`) — `"EarlyWaterStress"`, `"SmartIrrigation"`, `"SprayingBlocked"`, `"BiomassAnomaly"`, `"Predictive72hStress"`
- `IsAccurate` (`bool`)
- `Comment` (`string?`)
- `CreatedAt` (`DateTimeOffset`)

---

## 6. NASA Data Ingestion & Resilience Pipeline

### 6.1 Data Sources
| Domain | Mission / Sensor | Parameter | Primary Source |
| :--- | :--- | :--- | :--- |
| **Precipitation (daily history)** | GPM IMERG | `PRECTOTCORR` (mm/day) | NASA POWER Point API (`AG` community) |
| **Precipitation (workability 12h window)** | Scenario fixture stream | `RainLast12hMm` | `MockNasaClient` deterministic fixtures only (`DemoScenario` fields); unavailable for newly drawn live fields |
| **Precipitation (workability forecast 24–48h)** | Scenario fixture stream | `RainForecast24hMm`, `RainForecast48hMm` | `MockNasaClient` deterministic fixtures only (`DemoScenario` fields); unavailable for newly drawn live fields |
| **Surface Soil Moisture** | SMAP (0–5 cm) | `GWETTOP` ($0.0 - 1.0$) | NASA POWER Point API |
| **Rootzone Soil Moisture** | SMAP (0–100 cm) | `GWETROOT` ($0.0 - 1.0$) | NASA POWER Point API |
| **Solar Radiation** | CERES / MODIS | `ALLSKY_SFC_SW_DWN` | NASA POWER Point API |
| **Vegetation Index** | MODIS / VIIRS | `NDVI`, `EVI` ($0.0 - 1.0$) | Pre-extracted AppEEARS slices + radiation/moisture-derived curve |
| **Evaporative Stress** | ECOSTRESS | `ESI` ($0.0 - 1.0$) | Pre-extracted AppEEARS slices + thermal/moisture derivation |

### 6.2 Handling NASA API Quirks (`NasaPowerClient`)
1. **`-999` Missing Value Handling:** NASA POWER can return `-999.0` for missing observations. `NasaPowerClient` must signal this condition to `ResilientNasaClient`, which falls back to deterministic fixtures as required by `P0-4`; neither `-999.0` nor silently forward-filled live values should reach downstream formulas or ONNX tensors.
2. **Coordinate Rounding for Cache Hits:** Coordinates passed to `ResilientNasaClient` are rounded to 2 decimal places (`Math.Round(lat, 2)`, ~1.1 km resolution, well within SMAP/POWER grid cell size) and cached in `HybridCache` for 6 hours.
3. **Automatic Fallback (`ResilientNasaClient`):** Wraps `NasaPowerClient` with a strict `3.0s` timeout. If NASA endpoints rate-limit or lag during a live presentation, it transparently falls back to `MockNasaClient`.

---

## 7. Deterministic Agro Decision Engine

All agronomic formulas live in `Features/AgroAnalytics/AgroFormulas.cs` as pure, stateless functions:

### 7.1 Early Stress Warning & Smart Irrigation Calculator
- **Water Deficit Index (WDI):**
  $$\text{WDI} = 1.0 - (0.6 \cdot \mathrm{sm\_rootzone} + 0.4 \cdot \mathrm{evapotranspiration\_esi})$$
- **Hidden Stress Trigger:** If $\text{WDI} > 0.65$ while $\Delta\text{NDVI}_{14\text{d}} \ge -0.05$ (leaves still appear green), trigger `Warning: Hidden Water Stress`.
- **Smart Irrigation Dose ($\text{mm}$):**
  Calculates exact water deficit in millimeters based on crop-specific target rootzone moisture $\theta_{\text{target}}$ (e.g., `Corn` = $0.55$, `Wheat` = $0.45$, `Soy` = $0.50$, `Sunflower` = $0.40$) and effective root depth $D_{\text{root}}$:
  $$\text{IrrigationMm} = \max\left(0, (\theta_{\text{target}} - \mathrm{sm\_rootzone}) \cdot D_{\mathrm{root\_mm}} \cdot \mathrm{porosity\_factor}\right)$$

### 7.2 Field Workability Window & Spraying Advisor
Evaluates machinery trafficability and agrochemical washout risk over a 48-hour window:
- **🟢 Optimal:** `RainLast24h < 2.0 mm` AND `SurfaceMoisture < 0.35` AND `RainForecast24h < 5.0 mm`
- **🔴 Blocked (Washout / Compaction Risk):** `RainLast12h > 10.0 mm` OR `RainForecast24h >= 5.0 mm` OR `SurfaceMoisture >= 0.45`
- **🟡 Marginal:** `SurfaceMoisture` in `[0.35, 0.45)` with `RainForecast24h < 5.0 mm`

### 7.3 Vegetation Anomaly Scout (Biomass Trend)
- Computes $\Delta\text{NDVI} = \text{NDVI}_{\text{current}} - \text{NDVI}_{\text{14d\_avg}}$.
- **Trigger:** If $\Delta\text{NDVI} < -0.12$ AND `sm_rootzone >= 0.35` (no drought present) $\rightarrow$ `Alert: Localized Biomass Drop (Potential Pest/Disease/Weed Outbreak — Scout Dispatch Recommended)`.

---

## 8. AI/ML & Deep Learning Architecture (ONNX)

Both models are trained in Python (`backend/ml/`) and loaded once at startup via `OnnxModelRegistry` (registered as a **Singleton** in DI).

### 8.1 Model 1: End-of-Season Crop Yield Predictor (`yield_model.onnx`)
- **Type:** Classical Tabular ML (`RandomForestRegressor` / `GradientBoostingRegressor` via `scikit-learn` + `skl2onnx`).
- **Input Tensor (`float32[1, 5]`, name: `"input"`):**
  1. `crop_type_id` (`0` = Wheat, `1` = Corn, `2` = Sunflower, `3` = Soy)
  2. `accumulated_precip_mm` (30-day cumulative precipitation)
  3. `avg_rootzone_moisture` (30-day mean `GWETROOT`)
  4. `peak_ndvi` (30-day maximum `NDVI`)
  5. `stress_days_count` (number of days where $\text{WDI} > 0.65$)
- **Output Tensor (`float32[1, 1]`, name: `"variable"`):**
  - Predicted yield in $\text{tons/ha}$, returned alongside regional baseline comparison ($\%\text{ vs average}$).

### 8.2 Model 2: 7-Day Soil Moisture & Evapotranspiration Forecaster (`soil_forecast.onnx`)
- **Type:** Deep Learning Time-Series Neural Network (`PyTorch` **LSTM / 1D-CNN**).
- **Input Tensor (`float32[1, 14, 4]`, name: `"sequence_input"`):**
  - Past 14 days of normalized daily satellite observations:
    `[PRECTOTCORR, GWETTOP, GWETROOT, ALLSKY_SFC_SW_DWN]`
- **Output Tensor (`float32[1, 7, 2]`, name: `"forecast_output"`):**
  - Next 7 days of predicted `[sm_rootzone, evapotranspiration_esi]`.
- **Integration with Agro Decision Engine:**
  - The forecasted Day +3 `[sm_rootzone, esi]` values are fed into `AgroFormulas.CalculateWaterDeficitIndex(...)` to provide **proactive 72-hour early stress warnings** before moisture actually drops.

---

## 9. Coding Conventions & Endpoint Slice Template

Every endpoint lives in its own static class under `Features/<Module>/<Action>.cs` and follows C# 13 / .NET 10 conventions:

```csharp
namespace FarmFlow.Api.Features.AgroAnalytics;

public static class GetWorkabilityWindow
{
    public record Response(
        Guid FieldId,
        string Status,          // "Optimal" | "Marginal" | "Blocked"
        double RainLast24hMm,
        double SurfaceMoisture,
        double RainForecast24hMm,
        bool SprayingSafe,
        string Recommendation);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/fields/{id:guid}/workability", Handle)
           .WithTags("AgroAnalytics")
           .WithSummary("Calculates 48h machinery workability and spraying safety window.");

    public static async Task<IResult> Handle(
        Guid id,
        AppDbContext db,
        INasaClient nasaClient,
        CancellationToken ct)
    {
        var field = await db.Fields.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, ct);
        if (field is null) return Results.NotFound();

        var series = await nasaClient.GetFieldSeriesAsync(
            field.Centroid.Y, field.Centroid.X, field.DemoScenario, ct);

        var latest = series.Latest;
        var status = (latest.RainLast12hMm, latest.RainLast24hMm, latest.SurfaceMoisture, latest.RainForecast24hMm) switch
        {
            (> 10.0, _, _, _)          => "Blocked",
            (_, < 2.0, < 0.35, < 5.0) => "Optimal",
            (_, _, < 0.45, < 5.0)     => "Marginal",
            _                         => "Blocked"
        };

        var sprayingSafe = latest.RainLast12hMm <= 10.0 && latest.RainForecast24hMm < 5.0;

        return Results.Ok(new Response(
            FieldId: field.Id,
            Status: status,
            RainLast24hMm: latest.RainLast24hMm,
            SurfaceMoisture: latest.SurfaceMoisture,
            RainForecast24hMm: latest.RainForecast24hMm,
            SprayingSafe: sprayingSafe,
            Recommendation: AgroFormulas.BuildWorkabilityMessage(status, sprayingSafe)
        ));
    }
}
```

---

## 10. Scope Traceability & Team Work Split

### 10.1 Mapping Scope Items ([docs/scope.md](file:///Users/spnch/documents/code/hackathons/NASA-2026/FarmFlow_Nasa/docs/scope.md)) to Backend Slices

| Scope ID | Tier | Feature | Implementing Backend Slice / Component | Owner |
| :--- | :--- | :--- | :--- | :--- |
| **P0-1** | 🟢 P0 | Interactive Field Catalog & GeoJSON Creation | `Features/Fields/CreateField.cs`, `GetFields.cs`, `Infrastructure/Spatial/GeoCalculator.cs` | `ghost` + `spnch` (GIS) |
| **P0-2** | 🟢 P0 | Pre-Seeded Demo Fields (4 Scenarios) | `Infrastructure/Database/DbSeeder.cs` | `ghost` |
| **P0-3** | 🟢 P0 | 14–30 Day Environmental Time-Series | `Infrastructure/Nasa/NasaPowerClient.cs`, `Features/AgroAnalytics/GetFieldDashboard.cs` | `spnch` |
| **P0-4** | 🟢 P0 | Resilient Mock Fallback & `-999` Sanitizer | `Infrastructure/Nasa/ResilientNasaClient.cs`, `MockNasaClient.cs` | `spnch` |
| **P0-5** | 🟢 P0 | F1: Smart Irrigation Calculator ($\text{mm}$) | `Features/AgroAnalytics/GetEarlyStressAlert.cs`, `AgroFormulas.cs` | `spnch` |
| **P0-6** | 🟢 P0 | F2: Workability & Spraying Advisor (48h) | `Features/AgroAnalytics/GetWorkabilityWindow.cs`, `AgroFormulas.cs` | `spnch` |
| **P0-7** | 🟢 P0 | F3: Early Thermal & Stress Detection (WDI) | `Features/AgroAnalytics/GetEarlyStressAlert.cs`, `AgroFormulas.cs` | `spnch` |
| **P0-8** | 🟢 P0 | F4: Vegetation Anomaly Scout ($\Delta\text{NDVI}$) | `Features/AgroAnalytics/GetBiomassTrend.cs`, `AgroFormulas.cs` | `spnch` |
| **P1-1** | 🔵 P1 | 7-Day Soil Moisture & ESI Forecaster (LSTM/CNN) | `backend/ml/train_soil_forecast.py` $\rightarrow$ `Features/Predictions/ForecastSoilMoisture.cs` | `spnch` |
| **P1-2** | 🔵 P1 | 72-Hour Proactive Stress Alert | `Features/Predictions/ForecastSoilMoisture.cs` + `AgroFormulas.CalculateWaterDeficitIndex` | `spnch` |
| **P1-3** | 🔵 P1 | End-of-Season Yield Predictor (Tabular ML) | `backend/ml/train_yield_model.py` $\rightarrow$ `Features/Predictions/PredictYield.cs` | `spnch` |
| **P1-4** | 🔵 P1 | Prioritized Daily Alert Feed | `Features/Alerts/GetActiveAlerts.cs` | `ghost` |
| **P2-1** | 🟣 P2 | Farmer Alert Feedback Loop | `Features/Alerts/SubmitAlertFeedback.cs`, `Entities/AlertFeedback.cs` | `ghost` |
| **P2-2** | 🟣 P2 | Sustainability & ROI Impact Metrics | `Features/AgroAnalytics/GetFieldDashboard.cs` (Water saved & runoff prevented KPIs) | `spnch` |

### 10.2 Developer Ownership Boundaries (Zero Merge Conflicts)

| Developer | Ownership Area | Directories |
| :--- | :--- | :--- |
| **`spnch`** | Spatial Engine, NASA Pipeline, Deterministic Agro Formulas, Python ML/DL Training & ONNX Inference | `Infrastructure/Spatial/`, `Infrastructure/Nasa/`, `Infrastructure/Ml/`, `Features/AgroAnalytics/`, `Features/Predictions/`, `backend/ml/` |
| **`ghost`** | Database Migrations & Seeding, Field CRUD Slice, Prioritized Alerts Feed, Farmer Feedback Loop | `Infrastructure/Database/`, `Features/Fields/`, `Features/Alerts/` |
