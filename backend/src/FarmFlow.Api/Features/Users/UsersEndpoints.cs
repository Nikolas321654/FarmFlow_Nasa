namespace FarmFlow.Api.Features.Users;

public static class UsersEndpoints
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder app)
    {
        UpdateMyProfile.MapEndpoint(app);
        return app;
    }
}
