using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Ml;
using FarmFlow.Api.Infrastructure.Nasa.NasaModels;
using Shouldly;
using Xunit;

namespace FarmFlow.Api.Tests.Unit;

public sealed class OnnxModelRegistryTests
{
    [Theory]
    [InlineData(CropType.Wheat)]
    [InlineData(CropType.Corn)]
    [InlineData(CropType.Sunflower)]
    [InlineData(CropType.Soy)]
    public void PredictYield_ReturnsPositiveYield_ForEachCropType(CropType cropType)
    {
        using var registry = new OnnxModelRegistry();

        var predicted = registry.PredictYield(
            cropType,
            accumulatedPrecipMm30d: 65.0,
            avgRootzoneMoisture30d: 0.45,
            peakNdvi30d: 0.78,
            stressDaysCount30d: 2);

        predicted.ShouldBeGreaterThan(0.5);
        predicted.ShouldBeLessThan(15.0);
    }

    [Fact]
    public void ForecastSoil7Days_ReturnsSevenBoundedDailyPredictions()
    {
        using var registry = new OnnxModelRegistry();
        var start = new DateOnly(2026, 5, 1);
        var sequence = Enumerable.Range(0, 14)
            .Select(i => new NasaDailyMetric(
                Date: start.AddDays(i),
                PrecipitationMm: i % 5 == 0 ? 4.0 : 0.0,
                SurfaceMoisture: 0.28,
                RootzoneMoisture: 0.34 - (i * 0.005),
                SolarRadiation: 17.5,
                Ndvi: 0.72,
                Esi: 0.55 - (i * 0.005)))
            .ToList();

        var forecast = registry.ForecastSoil7Days(sequence);

        forecast.Count.ShouldBe(7);
        foreach (var (smRoot, esi) in forecast)
        {
            smRoot.ShouldBeInRange(0.05, 0.95);
            esi.ShouldBeInRange(0.05, 0.98);
        }
    }

    [Fact]
    public void ForecastSoil7Days_ThrowsArgumentException_WhenSequenceIsNot14Days()
    {
        using var registry = new OnnxModelRegistry();
        var shortSequence = new List<NasaDailyMetric>
        {
            new(new DateOnly(2026, 5, 1), 0.0, 0.3, 0.4, 15.0, 0.7, 0.6)
        };

        Should.Throw<ArgumentException>(() => registry.ForecastSoil7Days(shortSequence));
    }
}
