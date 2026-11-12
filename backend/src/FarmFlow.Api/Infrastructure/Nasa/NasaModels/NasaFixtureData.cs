namespace FarmFlow.Api.Infrastructure.Nasa.NasaModels;

public record NasaFixtureData(
    string Scenario,
    double RainLast12hMm,
    double RainLast24hMm,
    double RainForecast24hMm,
    double RainForecast48hMm,
    IReadOnlyList<NasaFixtureRecord> DailyRecords);

public record NasaFixtureRecord(
    int DayOffset,
    double PrecipitationMm,
    double SurfaceMoisture,
    double RootzoneMoisture,
    double SolarRadiation,
    double Ndvi,
    double Esi);
