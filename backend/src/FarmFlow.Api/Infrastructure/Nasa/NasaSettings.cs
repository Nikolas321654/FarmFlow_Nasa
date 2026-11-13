namespace FarmFlow.Api.Infrastructure.Nasa;

public sealed class NasaSettings
{
    public const string SectionName = "NasaSettings";

    public string PowerApiBaseUrl { get; set; } = "https://power.larc.nasa.gov/api/temporal/daily/point";
    public double TimeoutSeconds { get; set; } = 3.0;
    public bool ForceMock { get; set; }
    public int CacheDurationHours { get; set; } = 6;
}
