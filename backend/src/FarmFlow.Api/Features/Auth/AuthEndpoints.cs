namespace FarmFlow.Api.Features.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        StartGoogleLogin.MapEndpoint(app);
        GetCsrfToken.MapEndpoint(app);
        GetCurrentUser.MapEndpoint(app);
        Logout.MapEndpoint(app);
        return app;
    }
}
