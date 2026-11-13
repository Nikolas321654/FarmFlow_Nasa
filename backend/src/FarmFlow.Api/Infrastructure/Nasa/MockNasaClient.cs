using FarmFlow.Api.Infrastructure.Nasa.NasaModels;

namespace FarmFlow.Api.Infrastructure.Nasa;

public class MockNasaClient(INasaFixtureStore fixtureStore, ILogger<MockNasaClient> logger)
    : INasaClient
{
    public Task<FieldSatelliteSeries> GetFieldSeriesAsync(
        double latitude,
        double longitude,
        string? demoScenario = null,
        int days = 14,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        var scenarioKey = DemoScenarios.Normalize(demoScenario, out var isRecognized);
        if (!isRecognized && !string.IsNullOrWhiteSpace(demoScenario))
        {
            logger.LogWarning("Unrecognized demo scenario '{Scenario}'. Defaulting to '{Optimal}'.",
                demoScenario, DemoScenarios.Optimal);
        }

        var fixture = fixtureStore.GetFixture(scenarioKey);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var clampedDays = Math.Clamp(days, 7, 30);

        var dailyMetrics = fixture.DailyRecords
            .TakeLast(clampedDays)
            .Select(r => new NasaDailyMetric(
                Date: today.AddDays(r.DayOffset),
                PrecipitationMm: r.PrecipitationMm,
                SurfaceMoisture: r.SurfaceMoisture,
                RootzoneMoisture: r.RootzoneMoisture,
                SolarRadiation: r.SolarRadiation,
                Ndvi: r.Ndvi,
                Esi: r.Esi))
            .ToList();

        var result = new FieldSatelliteSeries(
            DailySeries: dailyMetrics,
            RainLast12hMm: fixture.RainLast12hMm,
            RainLast24hMm: fixture.RainLast24hMm,
            RainForecast24hMm: fixture.RainForecast24hMm,
            RainForecast48hMm: fixture.RainForecast48hMm,
            DataSource: "MOCK_FIXTURE");

        return Task.FromResult(result);
    }
}
