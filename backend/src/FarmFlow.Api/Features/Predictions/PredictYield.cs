using System.Security.Claims;
using FarmFlow.Api.Features.AgroAnalytics;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Ml;
using FarmFlow.Api.Infrastructure.Nasa;

namespace FarmFlow.Api.Features.Predictions;

public static class PredictYield
{
    // 5-year (2020-2024) FAOSTAT / Our World in Data Ukraine national yield averages (tons/ha)
    private static readonly Dictionary<CropType, double> RegionalBaselinesTonsPerHa = new()
    {
        [CropType.Wheat] = 4.30,
        [CropType.Corn] = 6.81,
        [CropType.Sunflower] = 2.26,
        [CropType.Soy] = 2.40
    };

    public record FeaturesDto(
        double AccumulatedPrecipMm30d,
        double AvgRootzoneMoisture30d,
        double PeakNdvi30d,
        int StressDaysCount30d);

    public record Response(
        Guid FieldId,
        CropType CropType,
        string ModelName,
        double PredictedYieldTonsPerHa,
        double EstimatedTotalHarvestTons,
        double RegionalBaselineTonsPerHa,
        double DeltaVsBaselinePercent,
        FeaturesDto FeaturesUsed);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/fields/{id:guid}/predictions/yield", Handle)
           .WithTags("Predictions")
           .WithSummary("Estimates end-of-season crop yield via in-process ONNX inference.");

    public static async Task<IResult> Handle(
        Guid id,
        ClaimsPrincipal principal,
        AppDbContext db,
        INasaClient nasaClient,
        OnnxModelRegistry modelRegistry,
        CancellationToken ct)
    {
        var field = await db.GetAccessibleFieldAsync(id, principal, ct);
        if (field is null)
        {
            return Results.NotFound();
        }

        var series = await nasaClient.GetFieldSeriesAsync(
            field.Centroid.Y, field.Centroid.X, field.DemoScenario, days: 30, ct: ct);

        var daily = series.DailySeries;
        var accumulatedPrecipMm = Math.Round(daily.Sum(d => d.PrecipitationMm), 1);
        var avgRootzoneMoisture = Math.Round(daily.Average(d => d.RootzoneMoisture), 3);
        var peakNdvi = Math.Round(daily.Max(d => d.Ndvi), 3);
        var stressDaysCount = daily.Count(d =>
            AgroFormulas.CalculateWaterDeficitIndex(d.RootzoneMoisture, d.Esi) >
            AgroFormulas.WaterDeficitAlertThreshold);

        var predictedYield = modelRegistry.PredictYield(
            field.CropType,
            accumulatedPrecipMm,
            avgRootzoneMoisture,
            peakNdvi,
            stressDaysCount);

        var baseline = RegionalBaselinesTonsPerHa.GetValueOrDefault(field.CropType, 4.50);
        var deltaPercent = Math.Round(((predictedYield - baseline) / baseline) * 100.0, 1);
        var totalHarvestTons = Math.Round(predictedYield * field.AreaHectares, 2);

        return Results.Ok(new Response(
            FieldId: field.Id,
            CropType: field.CropType,
            ModelName: OnnxModelRegistry.YieldModelFileName,
            PredictedYieldTonsPerHa: predictedYield,
            EstimatedTotalHarvestTons: totalHarvestTons,
            RegionalBaselineTonsPerHa: baseline,
            DeltaVsBaselinePercent: deltaPercent,
            FeaturesUsed: new FeaturesDto(
                AccumulatedPrecipMm30d: accumulatedPrecipMm,
                AvgRootzoneMoisture30d: avgRootzoneMoisture,
                PeakNdvi30d: peakNdvi,
                StressDaysCount30d: stressDaysCount)));
    }
}
