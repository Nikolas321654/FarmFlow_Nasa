namespace FarmFlow.Api.Features.AgroAnalytics;

public static class AgroAnalyticsEndpoints
{
    public static IEndpointRouteBuilder MapAgroAnalyticsEndpoints(this IEndpointRouteBuilder app)
    {
        GetWorkabilityWindow.MapEndpoint(app);
        GetEarlyStressAlert.MapEndpoint(app);
        GetBiomassTrend.MapEndpoint(app);
        GetFieldDashboard.MapEndpoint(app);
        return app;
    }
}
