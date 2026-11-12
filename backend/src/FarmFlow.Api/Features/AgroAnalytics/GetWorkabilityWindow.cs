using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Nasa;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.AgroAnalytics;

public static class GetWorkabilityWindow
{
    public record Response(
        Guid FieldId,
        string Status,
        bool SprayingSafe,
        double RainLast12hMm,
        double RainLast24hMm,
        double RainForecast24hMm,
        double SurfaceMoisture,
        IReadOnlyList<AgroFormulas.WorkabilityWindowPeriod> Forecast48h,
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
        if (field is null)
        {
            return Results.NotFound();
        }

        var series = await nasaClient.GetFieldSeriesAsync(
            field.Centroid.Y, field.Centroid.X, field.DemoScenario, ct: ct);

        var eval = AgroFormulas.EvaluateWorkability(series);

        return Results.Ok(new Response(
            FieldId: field.Id,
            Status: eval.Status,
            SprayingSafe: eval.SprayingSafe,
            RainLast12hMm: eval.RainLast12hMm,
            RainLast24hMm: eval.RainLast24hMm,
            RainForecast24hMm: eval.RainForecast24hMm,
            SurfaceMoisture: eval.SurfaceMoisture,
            Forecast48h: eval.Forecast48h,
            Recommendation: eval.Recommendation));
    }
}
