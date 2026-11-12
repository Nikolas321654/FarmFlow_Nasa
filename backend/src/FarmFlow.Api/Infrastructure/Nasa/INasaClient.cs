using FarmFlow.Api.Infrastructure.Nasa.NasaModels;

namespace FarmFlow.Api.Infrastructure.Nasa;

public interface INasaClient
{
    Task<FieldSatelliteSeries> GetFieldSeriesAsync(
        double latitude,
        double longitude,
        string? demoScenario = null,
        int days = 14,
        CancellationToken ct = default);
}
