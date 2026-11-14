namespace FarmFlow.Api.Features.Alerts;

public static class AlertsEndpoints
{
    public static void MapAlertsEndpoints(this IEndpointRouteBuilder app)
    {
        GetActiveAlerts.MapEndpoint(app);
    }
}
