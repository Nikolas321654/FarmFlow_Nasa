using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Nasa;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.AgroAnalytics;

public static class GetBiomassTrend
{
    public record Response(
        Guid FieldId,
        double CurrentNdvi,
        double Ndvi14DayAvg,
        double DeltaNdvi,
        double DeltaPercent,
        double RootzoneMoisture,
        bool IsDroughtPresent,
        bool IsAnomalyDetected,
        string Recommendation);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/fields/{id:guid}/biomass", Handle)
           .WithTags("AgroAnalytics")
           .WithSummary("Detects localized biomass anomalies by comparing NDVI drops against soil moisture.");

    public static async Task<IResult> Handle(
        Guid id,
        AppDbContext db,
        INasaClient nasaClient,
        CancellationToken ct)
    {
        var field = await db.Fields.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, ct);
        if (field is null)
        {
            return Results.NotFound();
        }

        var series = await nasaClient.GetFieldSeriesAsync(
            field.Centroid.Y, field.Centroid.X, field.DemoScenario, ct: ct);

        var eval = AgroFormulas.EvaluateBiomass(field.Name, series.DailySeries);

        return Results.Ok(new Response(
            FieldId: field.Id,
            CurrentNdvi: eval.CurrentNdvi,
            Ndvi14DayAvg: eval.Ndvi14DayAvg,
            DeltaNdvi: eval.DeltaNdvi,
            DeltaPercent: eval.DeltaPercent,
            RootzoneMoisture: eval.RootzoneMoisture,
            IsDroughtPresent: eval.IsDroughtPresent,
            IsAnomalyDetected: eval.IsAnomalyDetected,
            Recommendation: eval.Recommendation));
    }
}
