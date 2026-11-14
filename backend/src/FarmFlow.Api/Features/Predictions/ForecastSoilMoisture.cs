using System.Security.Claims;
using FarmFlow.Api.Features.AgroAnalytics;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Ml;
using FarmFlow.Api.Infrastructure.Nasa;
using FarmFlow.Api.Infrastructure.Nasa.NasaModels;

namespace FarmFlow.Api.Features.Predictions;

public static class ForecastSoilMoisture
{
    public record ForecastDayDto(
        DateOnly Date,
        int DayOffset,
        double PredictedRootzoneMoisture,
        double PredictedEsi,
        double PredictedWaterDeficitIndex);

    public record Response(
        Guid FieldId,
        string ModelName,
        bool Proactive72hStressWarning,
        double ForecastedDay3WaterDeficitIndex,
        string ProactiveRecommendation,
        IReadOnlyList<ForecastDayDto> ForecastSeries);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/fields/{id:guid}/predictions/soil-forecast", Handle)
           .WithTags("Predictions")
           .WithSummary("Forecasts 7-day rootzone moisture and ESI via ONNX and emits 72h proactive stress warnings.");

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
            field.Centroid.Y, field.Centroid.X, field.DemoScenario, days: 14, ct: ct);

        var sequence14 = NormalizeTo14Days(series.DailySeries);
        var predictions = modelRegistry.ForecastSoil7Days(sequence14);
        var latestDate = series.Latest.Date;

        var forecastSeries = new List<ForecastDayDto>(predictions.Count);
        for (var i = 0; i < predictions.Count; i++)
        {
            var dayOffset = i + 1;
            var (smRoot, esi) = predictions[i];
            var wdi = AgroFormulas.CalculateWaterDeficitIndex(smRoot, esi);

            forecastSeries.Add(new ForecastDayDto(
                Date: latestDate.AddDays(dayOffset),
                DayOffset: dayOffset,
                PredictedRootzoneMoisture: smRoot,
                PredictedEsi: esi,
                PredictedWaterDeficitIndex: wdi));
        }

        var day3 = forecastSeries[2];
        var proactiveWarning = day3.PredictedWaterDeficitIndex > AgroFormulas.WaterDeficitAlertThreshold;
        var recommendation = proactiveWarning
            ? $"AI Forecast Warning: Rootzone moisture is projected to drop to {day3.PredictedRootzoneMoisture:0.00} in 72 hours (WDI {day3.PredictedWaterDeficitIndex:0.00}). Schedule preventive irrigation within 48 hours."
            : $"AI Forecast Stable: Projected 72-hour rootzone moisture ({day3.PredictedRootzoneMoisture:0.00}, WDI {day3.PredictedWaterDeficitIndex:0.00}) remains within safe crop thresholds.";

        return Results.Ok(new Response(
            FieldId: field.Id,
            ModelName: OnnxModelRegistry.SoilForecastModelFileName,
            Proactive72hStressWarning: proactiveWarning,
            ForecastedDay3WaterDeficitIndex: day3.PredictedWaterDeficitIndex,
            ProactiveRecommendation: recommendation,
            ForecastSeries: forecastSeries));
    }

    internal static List<NasaDailyMetric> NormalizeTo14Days(IReadOnlyList<NasaDailyMetric> dailySeries)
    {
        if (dailySeries.Count >= OnnxModelRegistry.SoilSequenceLength)
        {
            return dailySeries.TakeLast(OnnxModelRegistry.SoilSequenceLength).ToList();
        }

        var padded = new List<NasaDailyMetric>(OnnxModelRegistry.SoilSequenceLength);
        var earliest = dailySeries[0];
        while (padded.Count + dailySeries.Count < OnnxModelRegistry.SoilSequenceLength)
        {
            padded.Add(earliest);
        }

        padded.AddRange(dailySeries);
        return padded;
    }
}
