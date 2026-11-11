using FarmFlow.Api.Infrastructure.Nasa;

namespace FarmFlow.Api.Features.System;

public static class SystemEndpoints
{
    public static IEndpointRouteBuilder MapSystemEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", () => Results.Ok(new
        {
            status = "Healthy",
            service = "FarmFlow.Api",
            timestamp = DateTimeOffset.UtcNow
        })).WithTags("System")
           .WithSummary("System health status and timestamp.");

        app.MapGet("/api/test/nasa/{scenario}", async (string scenario, INasaClient client, CancellationToken ct) =>
        {
            var series = await client.GetFieldSeriesAsync(48.45, 31.18, scenario, 14, ct);
            return Results.Ok(series);
        }).WithTags("Testing")
          .WithSummary("Quick diagnostic endpoint to verify NASA mock scenario responses.");

        return app;
    }
}
