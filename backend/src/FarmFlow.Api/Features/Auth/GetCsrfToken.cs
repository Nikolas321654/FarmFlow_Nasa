using FarmFlow.Api.Infrastructure.Auth;
using Microsoft.AspNetCore.Antiforgery;

namespace FarmFlow.Api.Features.Auth;

public static class GetCsrfToken
{
    public record Response(string HeaderName, string Token);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/auth/csrf", Handle)
           .WithTags("Auth")
           .WithSummary("Issues an anti-forgery cookie and request token for state-changing requests.");

    public static IResult Handle(HttpContext httpContext, IAntiforgery antiforgery)
    {
        var tokens = antiforgery.GetAndStoreTokens(httpContext);
        return Results.Ok(new Response(AuthConfiguration.CsrfHeaderName, tokens.RequestToken!));
    }
}
