# FarmFlow — Product Overview & User Journeys

> **Scope Alignment:** Implements the `P0`–`P2` features and guardrails in [docs/scope.md](file:///Users/spnch/documents/code/hackathons/NASA-2026/FarmFlow_Nasa/docs/scope.md) and API contracts in [docs/api.md](file:///Users/spnch/documents/code/hackathons/NASA-2026/FarmFlow_Nasa/docs/api.md).

## 1. Product Vision

**FarmFlow** turns NASA Earth Science satellite observations (GPM precipitation, SMAP surface and rootzone moisture, solar radiation, MODIS/VIIRS NDVI, ECOSTRESS evaporative stress) into clear field-level agronomy actions:
- **Can I drive machinery and spray today?** (48h Workability & Washout Advisor)
- **Is there hidden drought stress before leaves wilt?** (Water Deficit Index + Crop-Specific Smart Irrigation mm)
- **Is biomass dropping without drought?** (NDVI Anomaly / Pest & Disease Scout)
- **What happens over the next 7 days and at harvest?** (ONNX Soil Forecast & Yield Prediction, `P1`)

---

## 2. Core User Personas & Modes

### 2.1 Guest Visitor (Instant Demo Exploration — No Login Wall)
- Opens the app directly without creating an account.
- Can browse the **4 public Ukrainian demo fields** (`IsDemo = true`), inspect polygons, satellite time-series charts, and run all analytics dashboards (`/dashboard`, `/workability`, `/stress`, `/biomass`).
- Cannot view, create, or delete private farmer fields.
- Clicking **Add Field** (or attempting to save/delete custom fields) prompts a clean **"Continue with Google"** action.

### 2.2 Signed-In Farmer (Google-Only Account & Private Workspace)
- Signs in via server-side **Google OAuth 2.0** and receives a persistent `HttpOnly` session cookie.
- Identity is permanently anchored to Google's stable **`sub`** (`GoogleSubjectId`), never email.
- Automatically has a profile initialized with Google display name, email (read-only), and avatar URL.
- Can set a **custom display name** (`PATCH /api/users/me`) that persists across logout/login cycles and is never overwritten by Google on subsequent sign-ins.
- Sees both the **4 public demo fields** and **their own private fields** (`OwnerId == currentUserId`).
- Can create and delete their own private fields; cannot view or mutate another farmer's private fields, and cannot delete shared demo fields (`403 Forbidden`).

---

## 3. Core Flows (`UF-1` + Auth)

1. **Instant Guest Demo (`UF-1`):** Open app -> select a pre-seeded demo field -> inspect 48h workability, hidden drought stress (`WDI`), irrigation dose (`mm`), and NDVI anomaly status immediately.
2. **Add Custom Field Gate:** Guest clicks **Add Field** -> prompted **"Continue with Google"** -> completes Google OAuth -> returns to workspace -> draws polygon or uploads GeoJSON -> saved privately to `OwnerId`.
3. **Profile Management:** Signed-in user views avatar & email in header/profile -> edits custom display name -> logs out and signs back in -> custom display name and private fields remain intact.

---

## 4. Privacy & Security Guarantees

- Private user fields are invisible (`404 Not Found`) to unauthenticated guests and other authenticated users across field catalog, field detail, analytics, predictions, and alert endpoints.
- Demo field ownership is enforced strictly on the backend (`IsDemo = true, OwnerId = null`); clients cannot spoof `OwnerId` or `IsDemo`.
- OAuth tokens and secrets never leave the backend. State-changing cookie endpoints require CSRF validation.
