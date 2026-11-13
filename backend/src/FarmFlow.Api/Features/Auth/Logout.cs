using FarmFlow.Api.Infrastructure.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace FarmFlow.Api.Features.Auth;

public static class Logout
{
    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapPost("/api/auth/logout", (Delegate)Handle)
           .AddEndpointFilter<CsrfValidationFilter>()
           .WithTags("Auth")
           .WithSummary("Signs out the current persistent session cookie.");

    public static async Task<IResult> Handle(HttpContext httpContext)
    {
        await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Results.NoContent();
    }
}
