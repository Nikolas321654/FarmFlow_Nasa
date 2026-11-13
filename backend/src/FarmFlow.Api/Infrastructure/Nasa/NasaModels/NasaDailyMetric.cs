namespace FarmFlow.Api.Infrastructure.Nasa.NasaModels;

public record NasaDailyMetric(
    DateOnly Date,
    double PrecipitationMm,
    double SurfaceMoisture,
    double RootzoneMoisture,
    double SolarRadiation,
    double Ndvi,
    double Esi);