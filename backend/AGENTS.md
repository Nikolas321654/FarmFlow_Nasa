# FarmFlow Backend & AI/ML — Agent Guidelines

Instructions for AI coding agents working inside `./backend/` (including `.NET 10` API and `./backend/ml/`).

---

## 1. Authoritative References

Read and align with these documents before making architectural or contract changes:

- **Architecture & Slice Blueprint:** @backend/docs/architecture.md
- **Hackathon Scope & Guardrails:** @docs/scope.md
- **REST & GeoJSON API Contracts:** @docs/api.md
- **Git Branching & Commit Rules:** @docs/git-workflow.md
- **CI Pipeline Checks:** @.github/workflows/backend-ci.yml

---

## 2. Technology Stack

- **Runtime & API:** `.NET 10` (`net10.0`, C# 13/14), ASP.NET Core Minimal APIs (`backend/FarmFlow.slnx`, `backend/src/FarmFlow.Api/FarmFlow.Api.csproj`).
- **Database & Spatial:** PostgreSQL + PostGIS (`backend/docker-compose.yml`), EF Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite`, `Microsoft.EntityFrameworkCore.Design`), NetTopologySuite + `NetTopologySuite.IO.GeoJSON4STJ` (SRID `4326`, RFC 7946 `[longitude, latitude]`).
- **Caching & HTTP:** `IHttpClientFactory`, `HybridCache` (`Microsoft.Extensions.Caching.Hybrid`), `IMemoryCache`.
- **AI/ML:**
  - **Offline Training (`backend/ml/`):** Python, `scikit-learn` + `skl2onnx` (`yield_model.onnx`), `PyTorch` + `onnx` (`soil_forecast.onnx`).
  - **Production Inference (`.NET`):** In-process via `Microsoft.ML.OnnxRuntime` (`InferenceSession` registered as a **Singleton**). Never run a Python microservice in production.
- **API Docs & Error Handling:** `Microsoft.AspNetCore.OpenApi` + `Scalar.AspNetCore` (`/scalar/v1`), RFC 7807/9457 `ProblemDetails`.
- **Testing:** `xUnit v3` (`xunit.v3`), `Shouldly`, `Microsoft.AspNetCore.Mvc.Testing`, `Testcontainers.PostgreSql` (`postgis/postgis`), `Respawn`.
- **Static Analysis:** `SonarAnalyzer.CSharp` (warnings treated as errors in CI and required local verification).

---

## 3. Architecture & Scope Rules

1. **Vertical Slice Architecture:**
   - Organize endpoints as self-contained feature slices under `Features/<Module>/<Action>.cs` (static class with nested `Request`/`Response` records, `MapEndpoint`, and `Handle`).
   - Group slice route registrations via extension methods (e.g., `app.MapSystemEndpoints()`). Keep `Program.cs` strictly as the composition root (with `public partial class Program;` for integration testing).
   - Do **not** introduce N-tier/Clean Architecture layers (`Controllers`, `BLL`, `DAL`, `Repositories`, `MediatR`) or `IFooService` wrappers for single-implementation logic—inject `AppDbContext` directly into handlers.
2. **Respect Hard Out-of-Scope Guardrails (@docs/scope.md):**
   - No Auth/JWT/RBAC, no GraphQL/gRPC, no message brokers, no live HDF5/GeoTIFF parsing in .NET, no synchronous AppEEARS polling, and no separate Python inference service.
3. **Preserve Slice Isolation (@backend/docs/architecture.md):**
   - Keep feature slices decoupled and free of cross-slice hacks so parallel work and isolated testing remain clean.

---

## 4. Code Quality & SOLID Principles

All backend code must strictly adhere to **SOLID** and clean C# practices:

- **S — Single Responsibility Principle (SRP):**
  - Give each class, slice, and helper one clear responsibility and one reason to change.
  - Keep I/O and persistence separate from projection/domain logic (e.g., `INasaFixtureStore` / `FileNasaFixtureStore` handles fixture loading, `MockNasaClient` handles time-series projection, `AgroFormulas` holds pure stateless agronomic math).
  - Keep `Program.cs` free of inline endpoint handlers and domain logic.
- **O — Open/Closed Principle (OCP):**
  - Extend behavior through composition, decorators, or data-driven mappings rather than modifying working logic with sprawling conditionals.
  - Example: wrap live (`NasaPowerClient`) and fallback (`MockNasaClient`) clients using a decorator (`ResilientNasaClient : INasaClient`) and use dictionary-based alias lookups (`DemoScenarios`) instead of hardcoded switch chains.
- **L — Liskov Substitution Principle (LSP):**
  - Every `INasaClient` (or any interface) implementation must honor the full contract interchangeably: tolerate optional/unused parameters (e.g., `demoScenario` vs. `latitude`/`longitude`), honor `CancellationToken`, and return valid non-empty domain objects.
  - Guard invariants explicitly (e.g., `FieldSatelliteSeries.Latest` throws `InvalidOperationException` if empty rather than leaking an index error).
- **I — Interface Segregation Principle (ISP):**
  - Keep interfaces small, cohesive, and client-focused (e.g., `INasaClient` exposes only `GetFieldSeriesAsync`, `INasaFixtureStore` exposes only `GetFixture`). Never build bloated multi-purpose interfaces.
- **D — Dependency Inversion Principle (DIP):**
  - High-level slices and services must depend on abstractions (`INasaClient`, `INasaFixtureStore`, `IOptions<T>`), never concrete hosting or filesystem APIs (`IWebHostEnvironment`, `File.*`) inside business or client logic.

### Additional C# / .NET 10 Standards
- **Idiomatic C#:** Use primary constructors, immutable `record` DTOs, target-typed `new`, pattern matching / `switch` expressions, `AsNoTracking()` on read queries, and pass `CancellationToken` through every async call.
- **DRY & Shallow Nesting:** Centralize shared formulas (`AgroFormulas`) and spatial math (`GeoCalculator`). Keep methods focused with early returns and shallow nesting.
- **Minimal, High-Signal Comments Only:** Do **not** add `/// <summary>` XML doc bloat on self-explanatory classes/methods or obvious comments that restate the code. Only comment non-obvious *why* (e.g., NASA API quirks or non-trivial invariants).
- **NASA Data Safety:** Never let `-999.0` sentinel values or uninitialized arrays reach agronomic formulas or ONNX tensors; detect missing data and trigger `ResilientNasaClient` fallback.
- **SonarAnalyzer Compliance:** Write code that satisfies `SonarAnalyzer.CSharp` cleanly—use `await app.RunAsync()`, avoid insecure wildcard CORS in production, dispose resources cleanly, and never swallow exceptions silently. **Do not** suppress analyzer warnings (`#pragma warning disable` / `SuppressMessage`) unless strictly unavoidable and explained in a comment.

---

## 5. Testing Standards (`backend/tests/FarmFlow.Api.Tests`)

- **Framework & Assertions:** Use **`xUnit v3`** (`xunit.v3` + `xunit.runner.visualstudio` + `Microsoft.NET.Test.Sdk`) and **`Shouldly`**. Set `<DebugType>embedded</DebugType>` in test projects so Shouldly emits descriptive diagnostics in Release/CI builds.
- **SonarAnalyzer Compatibility:** Keep Shouldly assertions (`.ShouldBe(...)`, `Should.ThrowAsync(...)`) directly inside `[Fact]` / `[Theory]` bodies so `S2699` detects them without false positives. If test-only style rules (e.g., theory parameter count `S107`) need relaxation, configure `[**/tests/**/*.cs]` in `.editorconfig` rather than scattering `#pragma warning disable`.
- **Unit Tests (`Unit/`):**
  - Test pure domain & spatial logic (`AgroFormulas`, `GeoCalculator`, `DemoScenarios`) with zero database or network dependencies.
  - Test HTTP clients and resilience decorators (`NasaPowerClient`, `ResilientNasaClient`) using a lightweight fake `HttpMessageHandler` and a real in-memory `HybridCache` (`AddMemoryCache()` + `AddHybridCache()`), verifying `-999.0` rejection, timeout fallback, coordinate rounding, and caching without heavy mocking frameworks or EF InMemory hacks.
- **Integration Tests (`Integration/`):**
  - Use **`WebApplicationFactory<Program>`** backed by **`Testcontainers.PostgreSql`** with a multi-arch PostGIS image (`new PostgreSqlBuilder().WithImage("imresamu/postgis:17-3.5-alpine")`, never `:latest`).
  - Share a single container across integration tests via **`ICollectionFixture<T>`** and `xUnit v3` `IAsyncLifetime` (`ValueTask InitializeAsync()` / `ValueTask DisposeAsync()`). Run `await db.Database.MigrateAsync()` once on startup.
  - Reset state between tests using **`Respawn`** (`Respawner.ResetAsync`), explicitly excluding `__EFMigrationsHistory` and PostGIS system tables (`spatial_ref_sys`, `geometry_columns`, `geography_columns`, `raster_columns`, `raster_overviews`).
  - Stub external NASA HTTP calls inside `WebApplicationFactory` (`HttpMessageHandler` / deterministic fixtures) so integration tests never depend on live external APIs.
  - Mark container-backed test classes with `[Trait("Category", "Integration")]` so fast inner-loop runs can skip Docker (`--filter "Category!=Integration"`) while full verification runs everything.

---

## 6. Mandatory Build, Format & Verification Gate

Before finishing **any** code edit (and before every commit), run from `./backend`:

```bash
dotnet format ./FarmFlow.slnx --no-restore --verify-no-changes --verbosity minimal
dotnet build ./FarmFlow.slnx --no-restore --configuration Release /warnaserror
dotnet test ./FarmFlow.slnx --no-build --configuration Release --verbosity normal
```

*(When running fast local unit iterations without Docker available, `dotnet test --filter "Category!=Integration"` may be used, but full CI requires Docker/Testcontainers and all tests passing.)*

- **Immediate Fix Policy:** If `dotnet build /warnaserror`, `dotnet format`, or `dotnet test` fails for **any** reason—compiler error, CS warning, `SonarAnalyzer.CSharp` rule, or failing test—**fix it immediately** before concluding your work or committing.
- **Workspace Hygiene:** Never leave generated tool folders (`.nuget/`, `.local/`, `Library/`) or `bin/`/`obj/` artifacts untracked or committed.

---

## 7. Git Hygiene & Granular Commits

Follow @docs/git-workflow.md strictly:

1. **Small, Granular Commits (Commit-Level SRP):**
   - Each commit must represent **one atomic, single-responsibility change** (e.g., one feature slice, one refactor, one bug fix, or one config change).
   - **Never create "god-commits"** that mix unrelated features, refactors, dependency additions, and formatting changes in one commit.
   - Every commit must independently pass `dotnet build /warnaserror`.
2. **Branch Naming (`<kind-of-work>/<work-done>`):**
   - Branch from `backend` (never push directly to `main`, `develop`, `backend`, or `frontend`).
   - Categorize by **kind of work** (`feature/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`, `ci/*`)—never prefix with domain (`backend/`, `frontend/`).
3. **Commit Message Format:**
   ```text
   [<type>-<scope>] - <Description>
   ```
   Examples:
   - `[feature-backend] - Implemented GeoCalculator polygon area and centroid helper`
   - `[fix-backend] - Resolved SonarAnalyzer S6966 RunAsync warning in Program.cs`
   - `[chore-backend] - Added backend AGENTS.md guidelines`
4. **Pull Requests:** Open PRs from your working branch into **`backend`** (or **`main`** for root shared docs/CI only).
