using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Nasa;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.Fields;

public static class GetFieldById
{
    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/fields/{id:guid}", Handle)
           .WithTags("Fields")
           .WithSummary("Gets field metadata, geometry, and current satellite status flags by ID.");

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

        var summary = await FieldSummaryMapper.ToSummaryAsync(field, nasaClient, ct);
        return Results.Ok(summary);
    }
}
