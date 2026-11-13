using System.Security.Claims;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.Fields;

public static class DeleteField
{
    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapDelete("/api/fields/{id:guid}", Handle)
           .RequireAuthorization()
           .AddEndpointFilter<CsrfValidationFilter>()
           .WithTags("Fields")
           .WithSummary("Deletes a private user-owned field from the catalog.");

    public static async Task<IResult> Handle(
        Guid id,
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = principal.GetUserIdOrNull();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var field = await db.Fields.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (field is null)
        {
            return Results.NotFound();
        }

        if (field.IsDemo)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Demo fields cannot be deleted.");
        }

        if (field.OwnerId != userId.Value)
        {
            return Results.NotFound();
        }

        db.Fields.Remove(field);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }
}
