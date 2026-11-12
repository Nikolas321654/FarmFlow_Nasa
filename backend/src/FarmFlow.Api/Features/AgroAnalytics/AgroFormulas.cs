using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Nasa.NasaModels;

namespace FarmFlow.Api.Features.AgroAnalytics;

public static class AgroFormulas
{
    public const double WaterDeficitAlertThreshold = 0.65;
    public const double BiomassAnomalyDeltaThreshold = -0.12;
    public const double DroughtRootzoneThreshold = 0.35;

    private sealed record CropWaterProfile(double TargetRootzoneMoisture, double EffectiveRootDepthMm, double PorosityFactor);

    private static readonly Dictionary<CropType, CropWaterProfile> CropProfiles = new()
    {
        [CropType.Wheat] = new(0.45, 140.0, 0.40),
        [CropType.Corn] = new(0.55, 150.0, 0.40),
        [CropType.Sunflower] = new(0.40, 160.0, 0.38),
        [CropType.Soy] = new(0.50, 145.0, 0.40)
    };

    public record WorkabilityWindowPeriod(string Period, string Status, string Reason);

    public record WorkabilityEvaluation(
        string Status,
        bool SprayingSafe,
        double RainLast12hMm,
        double RainLast24hMm,
        double RainForecast24hMm,
        double SurfaceMoisture,
        IReadOnlyList<WorkabilityWindowPeriod> Forecast48h,
        string Recommendation);

    public record StressAndIrrigationEvaluation(
        double WaterDeficitIndex,
        double Threshold,
        double RootzoneMoisture,
        double CropTargetMoisture,
        double EvaporativeStressIndex,
        double NdviCurrent,
        bool IsHiddenStressDetected,
        string Severity,
        bool IrrigationRecommended,
        double RecommendedIrrigationMm,
        int RecommendedWindowHours,
        string Recommendation);

    public record BiomassEvaluation(
        double CurrentNdvi,
        double Ndvi14DayAvg,
        double DeltaNdvi,
        double DeltaPercent,
        double RootzoneMoisture,
        bool IsDroughtPresent,
        bool IsAnomalyDetected,
        string Recommendation);

    public record ImpactMetricsEvaluation(
        double EstimatedWaterSavedM3PerHa,
        bool PreventedRunoffRisk,
        int EarlyWarningLeadTimeDays);

    public static double CalculateWaterDeficitIndex(double rootzoneMoisture, double esi)
    {
        var raw = 1.0 - (0.6 * rootzoneMoisture + 0.4 * esi);
        return Math.Round(Math.Clamp(raw, 0.0, 1.0), 3);
    }

    public static WorkabilityEvaluation EvaluateWorkability(FieldSatelliteSeries series)
    {
        var latest = series.Latest;

        var status = (series.RainLast12hMm, series.RainLast24hMm, latest.SurfaceMoisture, series.RainForecast24hMm) switch
        {
            ( > 10.0, _, _, _) => "Blocked",
            (_, < 2.0, < 0.35, < 5.0) => "Optimal",
            (_, _, < 0.45, < 5.0) => "Marginal",
            _ => "Blocked"
        };

        var sprayingSafe = series.RainLast12hMm <= 10.0 && series.RainForecast24hMm < 5.0;

        var next24hStatus = ResolveForecastDayStatus(series.RainForecast24hMm, status);
        var next48hStatus = ResolveForecastDayStatus(series.RainForecast48hMm, next24hStatus);

        var forecast48h = new List<WorkabilityWindowPeriod>
        {
            new("Today", status, BuildTodayWorkabilityReason(status, series.RainLast12hMm, latest.SurfaceMoisture)),
            new("Next 24h", next24hStatus, BuildForecastWorkabilityReason(next24hStatus, series.RainForecast24hMm)),
            new("24h–48h", next48hStatus, BuildForecastWorkabilityReason(next48hStatus, series.RainForecast48hMm))
        };

        return new WorkabilityEvaluation(
            Status: status,
            SprayingSafe: sprayingSafe,
            RainLast12hMm: Math.Round(series.RainLast12hMm, 1),
            RainLast24hMm: Math.Round(series.RainLast24hMm, 1),
            RainForecast24hMm: Math.Round(series.RainForecast24hMm, 1),
            SurfaceMoisture: Math.Round(latest.SurfaceMoisture, 3),
            Forecast48h: forecast48h,
            Recommendation: BuildWorkabilityMessage(status, sprayingSafe));
    }

    public static StressAndIrrigationEvaluation EvaluateStressAndIrrigation(
        CropType cropType,
        string fieldName,
        IReadOnlyList<NasaDailyMetric> dailySeries)
    {
        var latest = dailySeries[^1];
        var profile = CropProfiles[cropType];

        var wdi = CalculateWaterDeficitIndex(latest.RootzoneMoisture, latest.Esi);
        var ndvi14dAvg = dailySeries.TakeLast(14).Average(m => m.Ndvi);
        var ndviDelta = latest.Ndvi - ndvi14dAvg;

        var isHiddenStress = wdi > WaterDeficitAlertThreshold && ndviDelta >= -0.05;
        var irrigationRecommended = wdi > WaterDeficitAlertThreshold ||
                                    latest.RootzoneMoisture < profile.TargetRootzoneMoisture * 0.55;

        var irrigationMm = irrigationRecommended
            ? Math.Round(Math.Max(0.0, (profile.TargetRootzoneMoisture - latest.RootzoneMoisture)
                * profile.EffectiveRootDepthMm * profile.PorosityFactor), 1)
            : 0.0;

        var windowHours = wdi > 0.78 ? 24 : 36;
        var severity = wdi switch
        {
            > 0.78 => "Critical",
            > WaterDeficitAlertThreshold => "Warning",
            _ => "Info"
        };

        var stressPrefix = isHiddenStress
            ? $"Hidden water stress detected (WDI {wdi:0.00} while NDVI remains stable). "
            : string.Empty;

        var recommendation = irrigationRecommended
            ? $"{fieldName}: {stressPrefix}Recommended irrigation dose of {irrigationMm:0.#} mm within {windowHours} hours to prevent turgor loss."
            : $"{fieldName}: Rootzone moisture ({latest.RootzoneMoisture:0.00}) and transpiration are within healthy limits.";

        return new StressAndIrrigationEvaluation(
            WaterDeficitIndex: wdi,
            Threshold: WaterDeficitAlertThreshold,
            RootzoneMoisture: Math.Round(latest.RootzoneMoisture, 3),
            CropTargetMoisture: profile.TargetRootzoneMoisture,
            EvaporativeStressIndex: Math.Round(latest.Esi, 3),
            NdviCurrent: Math.Round(latest.Ndvi, 3),
            IsHiddenStressDetected: isHiddenStress,
            Severity: severity,
            IrrigationRecommended: irrigationRecommended,
            RecommendedIrrigationMm: irrigationMm,
            RecommendedWindowHours: irrigationRecommended ? windowHours : 0,
            Recommendation: recommendation);
    }

    public static BiomassEvaluation EvaluateBiomass(string fieldName, IReadOnlyList<NasaDailyMetric> dailySeries)
    {
        var latest = dailySeries[^1];
        var ndvi14DayAvg = dailySeries.TakeLast(14).Average(m => m.Ndvi);
        var deltaNdvi = latest.Ndvi - ndvi14DayAvg;
        var deltaPercent = ndvi14DayAvg > 0.0 ? deltaNdvi / ndvi14DayAvg * 100.0 : 0.0;

        var isDroughtPresent = latest.RootzoneMoisture < DroughtRootzoneThreshold;
        var isAnomalyDetected = deltaNdvi < BiomassAnomalyDeltaThreshold && !isDroughtPresent;

        var recommendation = (isAnomalyDetected, isDroughtPresent) switch
        {
            (true, _) => $"{fieldName}: Biomass index dropped by {Math.Abs(deltaPercent):0.1}% while soil moisture is optimal ({latest.RootzoneMoisture:0.00}). Potential localized pest, disease, or weed outbreak — scout inspection required.",
            (false, true) => $"{fieldName}: Vegetation index variation is accompanied by low rootzone moisture ({latest.RootzoneMoisture:0.00}). Prioritize moisture recovery.",
            _ => $"{fieldName}: Biomass growth trajectory is within normal seasonal bounds."
        };

        return new BiomassEvaluation(
            CurrentNdvi: Math.Round(latest.Ndvi, 3),
            Ndvi14DayAvg: Math.Round(ndvi14DayAvg, 3),
            DeltaNdvi: Math.Round(deltaNdvi, 3),
            DeltaPercent: Math.Round(deltaPercent, 1),
            RootzoneMoisture: Math.Round(latest.RootzoneMoisture, 3),
            IsDroughtPresent: isDroughtPresent,
            IsAnomalyDetected: isAnomalyDetected,
            Recommendation: recommendation);
    }

    public static ImpactMetricsEvaluation CalculateImpactMetrics(
        WorkabilityEvaluation workability,
        StressAndIrrigationEvaluation stress)
    {
        // Precision zone refill saves ~30% vs. blanket irrigation (1 mm = 10 m3/ha).
        var waterSaved = stress.IrrigationRecommended
            ? Math.Round(stress.RecommendedIrrigationMm * 10.0 * 0.3, 1)
            : 15.0;

        return new ImpactMetricsEvaluation(
            EstimatedWaterSavedM3PerHa: waterSaved,
            PreventedRunoffRisk: !workability.SprayingSafe,
            EarlyWarningLeadTimeDays: stress.IsHiddenStressDetected ? 4 : 0);
    }

    private static string BuildTodayWorkabilityReason(string status, double rain12h, double surfaceMoisture) =>
        status switch
        {
            "Blocked" => $"{rain12h:0.1} mm rain in last 12h + surface moisture {surfaceMoisture:0.00}",
            "Marginal" => $"Elevated surface moisture ({surfaceMoisture:0.00}); traction caution",
            _ => "Dry topsoil and clear weather window"
        };

    private static string BuildForecastWorkabilityReason(string status, double forecastRainMm) =>
        status switch
        {
            "Blocked" => $"{forecastRainMm:0.1} mm precipitation forecast (chemical washout risk)",
            "Marginal" => "Surface drying in progress; moderate wheel slip risk",
            _ => "Favorable bearing capacity and low washout risk"
        };

    private static string ResolveForecastDayStatus(double forecastRainMm, string previousStatus) =>
        (forecastRainMm >= 5.0, previousStatus == "Blocked") switch
        {
            (true, _) => "Blocked",
            (false, true) => "Marginal",
            _ => "Optimal"
        };

    private static string BuildWorkabilityMessage(string status, bool sprayingSafe) =>
        (status, sprayingSafe) switch
        {
            ("Optimal", true) => "Soil bearing capacity is optimal and washout risk is low. Safe for machinery and fertilizer/pesticide application.",
            ("Marginal", true) => "Marginal topsoil moisture: light operations allowed, but monitor heavy machinery traction.",
            (_, false) => "Blocked: High risk of nitrogen/fungicide washout and topsoil compaction by heavy machinery.",
            _ => "Blocked: Excessive topsoil moisture creates high compaction and machinery sinking risk."
        };
}
