using System.Security.Claims;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Nasa;

namespace FarmFlow.Api.Features.AgroAnalytics;

public static class GetEarlyStressAlert
{
    public record Response(
        Guid FieldId,
        double WaterDeficitIndex,
        double Threshold,
        double RootzoneMoisture,
        double CropTargetMoisture,
        double EvaporativeStressIndex,
        double NdviCurrent,
        bool IsHiddenStressDetected,
        bool IrrigationRecommended,
        double RecommendedIrrigationMm,
        int RecommendedWindowHours,
        string Recommendation);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/fields/{id:guid}/stress", Handle)
           .WithTags("AgroAnalytics")
           .WithSummary("Evaluates Early Water Stress (WDI) and Smart Irrigation dose.");

    public static async Task<IResult> Handle(
        Guid id,
        ClaimsPrincipal principal,
        AppDbContext db,
        INasaClient nasaClient,
        CancellationToken ct)
    {
        var field = await db.GetAccessibleFieldAsync(id, principal, ct);
        if (field is null)
        {
            return Results.NotFound();
        }

        var series = await nasaClient.GetFieldSeriesAsync(
            field.Centroid.Y, field.Centroid.X, field.DemoScenario, ct: ct);

        var eval = AgroFormulas.EvaluateStressAndIrrigation(field.CropType, field.Name, series.DailySeries);

        return Results.Ok(new Response(
            FieldId: field.Id,
            WaterDeficitIndex: eval.WaterDeficitIndex,
            Threshold: eval.Threshold,
            RootzoneMoisture: eval.RootzoneMoisture,
            CropTargetMoisture: eval.CropTargetMoisture,
            EvaporativeStressIndex: eval.EvaporativeStressIndex,
            NdviCurrent: eval.NdviCurrent,
            IsHiddenStressDetected: eval.IsHiddenStressDetected,
            IrrigationRecommended: eval.IrrigationRecommended,
            RecommendedIrrigationMm: eval.RecommendedIrrigationMm,
            RecommendedWindowHours: eval.RecommendedWindowHours,
            Recommendation: eval.Recommendation));
    }
}
