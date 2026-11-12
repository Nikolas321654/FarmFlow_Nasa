using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Nasa;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.Fields;

public static class GetFields
{
    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/fields", Handle)
           .WithTags("Fields")
           .WithSummary("Lists all fields with geometry, area, and current satellite status flags.");

    public static async Task<IResult> Handle(
        AppDbContext db,
        INasaClient nasaClient,
        CancellationToken ct)
    {
        var fields = await db.Fields
            .AsNoTracking()
            .OrderBy(f => f.Name)
            .ToListAsync(ct);

        var summaries = new List<FieldSummaryResponse>(fields.Count);
        foreach (var field in fields)
        {
            summaries.Add(await FieldSummaryMapper.ToSummaryAsync(field, nasaClient, ct));
        }

        return Results.Ok(summaries);
    }
}
