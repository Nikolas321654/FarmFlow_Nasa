using FarmFlow.Api.Infrastructure.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.Extensions.Options;

namespace FarmFlow.Api.Features.Auth;

public static class StartGoogleLogin
{
    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/auth/google", Handle)
           .WithTags("Auth")
           .WithSummary("Starts Google OAuth 2.0 sign-in and redirects back to a validated returnUrl.");

    public static async Task<IResult> Handle(
        string? returnUrl,
        IAuthenticationSchemeProvider schemeProvider,
        IOptions<AuthOptions> authOptions)
    {
        var scheme = await schemeProvider.GetSchemeAsync(GoogleDefaults.AuthenticationScheme);
        if (scheme is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Google authentication is not configured.");
        }

        var safeReturnUrl = FieldAccessExtensions.ResolveSafeReturnUrl(returnUrl, authOptions.Value);
        var properties = new AuthenticationProperties { RedirectUri = safeReturnUrl };

        return Results.Challenge(properties, [GoogleDefaults.AuthenticationScheme]);
    }
}
