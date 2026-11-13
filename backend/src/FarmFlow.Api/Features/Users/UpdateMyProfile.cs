using System.Security.Claims;
using FarmFlow.Api.Features.Auth;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.Users;

public static class UpdateMyProfile
{
    public const int MaxDisplayNameLength = 100;

    public record Request(string DisplayName);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapPatch("/api/users/me", Handle)
           .RequireAuthorization()
           .AddEndpointFilter<CsrfValidationFilter>()
           .WithTags("Users")
           .WithSummary("Updates the signed-in user's persistent custom display name.");

    public static async Task<IResult> Handle(
        Request request,
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = principal.GetUserIdOrNull();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var trimmed = request.DisplayName?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["displayName"] = ["Display name is required."]
            });
        }

        if (trimmed.Length > MaxDisplayNameLength)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["displayName"] = [$"Display name cannot exceed {MaxDisplayNameLength} characters."]
            });
        }

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        user.CustomDisplayName = trimmed;
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        return Results.Ok(UserProfileDto.FromEntity(user));
    }
}
