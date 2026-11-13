using System.Security.Claims;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.Auth;

public static class GetCurrentUser
{
    public record Response(bool Authenticated, UserProfileDto? User);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/auth/me", Handle)
           .WithTags("Auth")
           .WithSummary("Returns the current authentication state and user profile.");

    public static async Task<IResult> Handle(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = principal.GetUserIdOrNull();
        if (userId is null)
        {
            return Results.Ok(new Response(false, null));
        }

        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId.Value, ct);

        return user is null
            ? Results.Ok(new Response(false, null))
            : Results.Ok(new Response(true, UserProfileDto.FromEntity(user)));
    }
}
