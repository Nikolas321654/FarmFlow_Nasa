namespace FarmFlow.Api.Features.Predictions;

public static class PredictionsEndpoints
{
    public static IEndpointRouteBuilder MapPredictionsEndpoints(this IEndpointRouteBuilder app)
    {
        PredictYield.MapEndpoint(app);
        ForecastSoilMoisture.MapEndpoint(app);
        return app;
    }
}
