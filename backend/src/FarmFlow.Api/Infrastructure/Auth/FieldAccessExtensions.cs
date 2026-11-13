using System.Security.Claims;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Infrastructure.Auth;

public static class FieldAccessExtensions
{
    public static Guid? GetUserIdOrNull(this ClaimsPrincipal user)
    {
        if (user.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var rawId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(rawId, out var userId) ? userId : null;
    }

    public static IQueryable<Field> AccessibleTo(this IQueryable<Field> query, Guid? currentUserId) =>
        currentUserId is { } userId
            ? query.Where(f => f.IsDemo || f.OwnerId == userId)
            : query.Where(f => f.IsDemo);

    public static Task<Field?> GetAccessibleFieldAsync(
        this AppDbContext db,
        Guid fieldId,
        ClaimsPrincipal user,
        CancellationToken ct) =>
        db.Fields
            .AsNoTracking()
            .AccessibleTo(user.GetUserIdOrNull())
            .FirstOrDefaultAsync(f => f.Id == fieldId, ct);

    public static string ResolveSafeReturnUrl(string? returnUrl, AuthOptions options)
    {
        var fallback = string.IsNullOrWhiteSpace(options.FrontendDefaultRedirectUrl)
            ? "/"
            : options.FrontendDefaultRedirectUrl;

        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            return fallback;
        }

        // Allow strictly local relative paths while rejecting protocol-relative ("//evil.com") URLs.
        if (returnUrl.StartsWith('/') && !returnUrl.StartsWith("//", StringComparison.Ordinal) &&
            !returnUrl.StartsWith("/\\", StringComparison.Ordinal))
        {
            return returnUrl;
        }

        if (!Uri.TryCreate(returnUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            return fallback;
        }

        var origin = uri.GetLeftPart(UriPartial.Authority);
        var isAllowed = options.AllowedRedirectOrigins.Any(allowed =>
            string.Equals(allowed.TrimEnd('/'), origin, StringComparison.OrdinalIgnoreCase));

        return isAllowed ? returnUrl : fallback;
    }
}
