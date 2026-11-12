using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Nasa;
using FarmFlow.Api.Infrastructure.Nasa.NasaModels;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.AgroAnalytics;

public static class GetFieldDashboard
{
    public record CurrentMetricsDto(
        double PrecipitationMm24h,
        double AccumulatedPrecipitationMm30d,
        double SurfaceSoilMoisture,
        double RootzoneSoilMoisture,
        double SolarRadiation,
        double Ndvi,
        double EvaporativeStressIndex);

    public record WorkabilityDto(
        string Status,
        bool SprayingSafe,
        double RainLast12hMm,
        double RainLast24hMm,
        double RainForecast24hMm,
        double SurfaceMoisture,
        string Recommendation);

    public record StressAndIrrigationDto(
        double WaterDeficitIndex,
        bool IsHiddenStressDetected,
        string Severity,
        bool IrrigationRecommended,
        double RecommendedIrrigationMm,
        int RecommendedWindowHours,
        string Recommendation);

    public record BiomassDto(
        double CurrentNdvi,
        double Ndvi14DayAvg,
        double DeltaNdvi,
        double DeltaPercent,
        bool IsAnomalyDetected,
        string Recommendation);

    public record Response(
        Guid FieldId,
        string FieldName,
        CropType CropType,
        double AreaHectares,
        string DataSource,
        DateTimeOffset LastUpdatedUtc,
        CurrentMetricsDto CurrentMetrics,
        WorkabilityDto Workability,
        StressAndIrrigationDto StressAndIrrigation,
        BiomassDto Biomass,
        AgroFormulas.ImpactMetricsEvaluation ImpactMetrics,
        IReadOnlyList<NasaDailyMetric> TimeSeries);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/fields/{id:guid}/dashboard", Handle)
           .WithTags("AgroAnalytics")
           .WithSummary("Unified field dashboard returning satellite time-series, agronomic alerts, and impact KPIs.");

    public static async Task<IResult> Handle(
        Guid id,
        AppDbContext db,
        INasaClient nasaClient,
        int days = 14,
        CancellationToken ct = default)
    {
        var field = await db.Fields.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, ct);
        if (field is null)
        {
            return Results.NotFound();
        }

        var clampedDays = Math.Clamp(days, 7, 30);
        var fullSeries = await nasaClient.GetFieldSeriesAsync(
            field.Centroid.Y, field.Centroid.X, field.DemoScenario, days: 30, ct: ct);

        var latest = fullSeries.Latest;
        var accumulatedPrecip30d = Math.Round(fullSeries.DailySeries.Sum(m => m.PrecipitationMm), 1);

        var workability = AgroFormulas.EvaluateWorkability(fullSeries);
        var stress = AgroFormulas.EvaluateStressAndIrrigation(field.CropType, field.Name, fullSeries.DailySeries);
        var biomass = AgroFormulas.EvaluateBiomass(field.Name, fullSeries.DailySeries);
        var impact = AgroFormulas.CalculateImpactMetrics(workability, stress);

        var requestedTimeSeries = fullSeries.DailySeries.TakeLast(clampedDays).ToList();

        return Results.Ok(new Response(
            FieldId: field.Id,
            FieldName: field.Name,
            CropType: field.CropType,
            AreaHectares: field.AreaHectares,
            DataSource: fullSeries.DataSource,
            LastUpdatedUtc: DateTimeOffset.UtcNow,
            CurrentMetrics: new CurrentMetricsDto(
                PrecipitationMm24h: workability.RainLast24hMm,
                AccumulatedPrecipitationMm30d: accumulatedPrecip30d,
                SurfaceSoilMoisture: latest.SurfaceMoisture,
                RootzoneSoilMoisture: latest.RootzoneMoisture,
                SolarRadiation: latest.SolarRadiation,
                Ndvi: latest.Ndvi,
                EvaporativeStressIndex: latest.Esi),
            Workability: new WorkabilityDto(
                workability.Status,
                workability.SprayingSafe,
                workability.RainLast12hMm,
                workability.RainLast24hMm,
                workability.RainForecast24hMm,
                workability.SurfaceMoisture,
                workability.Recommendation),
            StressAndIrrigation: new StressAndIrrigationDto(
                stress.WaterDeficitIndex,
                stress.IsHiddenStressDetected,
                stress.Severity,
                stress.IrrigationRecommended,
                stress.RecommendedIrrigationMm,
                stress.RecommendedWindowHours,
                stress.Recommendation),
            Biomass: new BiomassDto(
                biomass.CurrentNdvi,
                biomass.Ndvi14DayAvg,
                biomass.DeltaNdvi,
                biomass.DeltaPercent,
                biomass.IsAnomalyDetected,
                biomass.Recommendation),
            ImpactMetrics: impact,
            TimeSeries: requestedTimeSeries));
    }
}
