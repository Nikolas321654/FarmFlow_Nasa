using FarmFlow.Api.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.Fields;

public static class DeleteField
{
    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapDelete("/api/fields/{id:guid}", Handle)
           .WithTags("Fields")
           .WithSummary("Deletes a field from the catalog.");

    public static async Task<IResult> Handle(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var deletedCount = await db.Fields
            .Where(f => f.Id == id)
            .ExecuteDeleteAsync(ct);

        return deletedCount == 0 ? Results.NotFound() : Results.NoContent();
    }
}
