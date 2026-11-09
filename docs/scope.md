# FarmFlow NASA — Hackathon Scope & Feature Tiers

> **Single Source of Truth:** This document defines what is **in scope** and **out of scope** for the FarmFlow hackathon submission across Backend, AI/ML, and Frontend teams. Detailed technical designs in [backend/docs/architecture.md](file:///Users/spnch/documents/code/hackathons/NASA-2026/FarmFlow_Nasa/backend/docs/architecture.md), [frontend/docs/architecture.md](file:///Users/spnch/documents/code/hackathons/NASA-2026/FarmFlow_Nasa/frontend/docs/architecture.md), and [docs/api.md](file:///Users/spnch/documents/code/hackathons/NASA-2026/FarmFlow_Nasa/docs/api.md) must strictly follow these boundaries.

---

## 1. Core Value Proposition
**FarmFlow** turns raw NASA Earth Science observations (**GPM IMERG, MODIS/VIIRS, ECOSTRESS, SMAP**) into actionable daily decisions for farmers:
1. **Preventive Irrigation:** Detect hidden crop water stress 3–5 days before visible leaf wilting and calculate the exact irrigation dose in millimeters.
2. **Field Workability & Spraying Safety:** Prevent machinery soil compaction and fertilizer/pesticide washout using 48-hour soil moisture and precipitation thresholds.
3. **Biomass Anomaly Scouting:** Distinguish localized pest/disease damage from drought by cross-referencing NDVI drops against rootzone moisture.
4. **AI/ML Forecasting:** Predict 7-day soil moisture/evapotranspiration trajectories (Deep Learning) and end-of-season crop yield (Tabular ML).

---

## 2. Priority Tiers (MoSCoW Roadmap)

### 🟢 Tier P0 — Core MVP (Must-Have for a Working Product)
If Tier P0 is complete, the product is fully functional and ready to demo on stage.

| ID | Module | Feature | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **P0-1** | **Field Management** | Interactive Field Catalog & Creation | Draw a polygon on the map or upload GeoJSON; backend automatically computes **Area (ha)** and **Centroid (lat/lon)** and stores `CropType` (`Wheat`, `Corn`, `Sunflower`, `Soy`) + `PlantedAt`. |
| **P0-2** | **Field Management** | Pre-Seeded Demo Fields | Database boots with 4 realistic pre-seeded Ukrainian fields representing distinct states (*Optimal*, *Hidden Water Stress*, *Rain/Spray Blocked*, *Pest Biomass Drop*). |
| **P0-3** | **Satellite Engine** | 14–30 Day Environmental Time-Series | Retrieve daily `PRECTOTCORR` (precip), `GWETTOP` (surface moisture 0–5cm), `GWETROOT` (rootzone moisture 0–100cm), `NDVI`, and `ESI` for any field centroid. |
| **P0-4** | **Satellite Engine** | Resilient Mock Fallback | Automatic fallback to deterministic JSON fixtures if NASA POWER API times out (>3s), returns `-999` missing values, or rate-limits during the live pitch. |
| **P0-5** | **Agro Decision Engine** | **F1: Smart Irrigation Calculator** | When `sm_rootzone` drops below crop threshold, generate a task card with exact irrigation depth in $\text{mm}$ and recommended timeframe (e.g., *"22 mm within 36h"*). |
| **P0-6** | **Agro Decision Engine** | **F2: Workability & Spraying Advisor** | Compute 48h field status (🟢 `Optimal`, 🟡 `Marginal`, 🔴 `Blocked`) and block chemical spraying if `rain_12h > 10mm` or `forecast_24h >= 5mm`. |
| **P0-7** | **Agro Decision Engine** | **F3: Early Thermal & Stress Detection** | Compute $\text{WaterDeficitIndex} = 1.0 - (0.6 \cdot \text{sm\_rootzone} + 0.4 \cdot \text{esi})$. Trigger hidden stress warning when $\text{WDI} > 0.65$ despite stable $\text{NDVI}$. |
| **P0-8** | **Agro Decision Engine** | **F4: Vegetation Anomaly Scout** | Compute $\Delta\text{NDVI} = \text{NDVI}_{\text{current}} - \text{NDVI}_{\text{14d\_avg}}$. Trigger pest/disease scouting alert when $\Delta\text{NDVI} < -0.12$ while soil moisture is healthy. |

---

### 🔵 Tier P1 — AI/ML & Competitive Differentiators (Should-Have to Win)
Features that elevate the technical score from a standard REST API wrapper to an AI-driven precision agriculture platform.

| ID | Module | Feature | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **P1-1** | **Deep Learning (ONNX)** | 7-Day Soil Moisture & ESI Forecaster | PyTorch `LSTM` / `1D-CNN` model exported to `soil_forecast.onnx` predicting the next 7 days of `[sm_rootzone, esi]` from the past 14 days of NASA observations. |
| **P1-2** | **Proactive Stress Warning** | 72-Hour Predictive Stress Alert | Feed the DL model's Day +3 forecast into the Water Deficit Index formula to warn farmers of impending stress **before** it occurs. |
| **P1-3** | **Tabular ML (ONNX)** | End-of-Season Yield Predictor | Scikit-learn `RandomForest` / `GradientBoosting` model exported to `yield_model.onnx` estimating harvest yield ($\text{tons/ha}$) + $\%$ delta vs. regional baseline. |
| **P1-4** | **Action Center** | Prioritized Daily Alert Feed | Single endpoint/view aggregating all active warnings and irrigation/scouting tasks across all fields, sorted by urgency. |

---

### 🟣 Tier P2 — Pitch Polish & Continuous Learning (Nice-to-Have)
Quick, high-visibility touches for judges if P0 and P1 are complete ahead of schedule.

| ID | Module | Feature | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **P2-1** | **Feedback Loop** | Farmer Alert Confirmation | Simple *"Was this alert accurate? Yes / No"* action on alert cards stored in DB (`AlertFeedback`) to demonstrate human-in-the-loop model retraining readiness. |
| **P2-2** | **Impact Metrics** | Sustainability & ROI Summary | Dashboard KPI badges estimating water saved ($\text{m}^3/\text{ha}$) and prevented fertilizer runoff based on active recommendations. |

---

## 3. Hard Out-of-Scope Guardrails (Anti-Scope-Creep)

To protect the hackathon deadline, the following are **strictly out of scope**:
- ❌ **No Live HDF5 / Raw GeoTIFF Raster Parsing in .NET:** We do not download or decompress multi-gigabyte raw satellite `.hdf5` or `.tif` files on the fly. We use NASA POWER JSON endpoints + pre-extracted AppEEARS data slices.
- ❌ **No Synchronous AppEEARS Task Queueing:** AppEEARS asynchronous jobs take minutes to hours to process; all AppEEARS data for demo regions is pre-extracted offline.
- ❌ **No User Authentication / RBAC / Multi-Tenancy:** No login screens, JWT plumbing, or OAuth. The app opens directly into the farmer's workspace.
- ❌ **No Python Microservice in Production:** Python is used strictly offline in `backend/ml/` to train and export `.onnx` artifacts. Production inference runs 100% inside the `.NET 10` API via `Microsoft.ML.OnnxRuntime`.
- ❌ **No Heavy CV / Drone Image Classification or RL:** No CNN leaf-disease photo classifiers or Reinforcement Learning schedulers.
- ❌ **No Message Brokers, GraphQL, or Multi-Project N-Tier Boilerplate:** Keep a single `.NET 10` project (`FarmFlow.Api`) using Vertical Slices.
