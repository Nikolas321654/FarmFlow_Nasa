namespace FarmFlow.Api.Infrastructure.Nasa.NasaModels;

public record FieldSatelliteSeries(
    IReadOnlyList<NasaDailyMetric> DailySeries,
    double RainLast12hMm,
    double RainLast24hMm,
    double RainForecast24hMm,
    double RainForecast48hMm,
    string DataSource)
{
    public NasaDailyMetric Latest => DailySeries.Count > 0
        ? DailySeries[^1]
        : throw new InvalidOperationException("FieldSatelliteSeries contains no daily metric records.");
}
