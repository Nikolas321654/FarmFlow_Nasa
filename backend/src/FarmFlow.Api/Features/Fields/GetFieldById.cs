using System.Security.Claims;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Nasa;

namespace FarmFlow.Api.Features.Fields;

public static class GetFieldById
{
    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/fields/{id:guid}", Handle)
           .WithTags("Fields")
           .WithSummary("Gets field metadata, geometry, and current satellite status flags by ID.");

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

        var summary = await FieldSummaryMapper.ToSummaryAsync(field, nasaClient, ct);
        return Results.Ok(summary);
    }
}
