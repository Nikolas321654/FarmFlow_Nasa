using FarmFlow.Api.Features.AgroAnalytics;
using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Nasa.NasaModels;
using Shouldly;
using Xunit;

namespace FarmFlow.Api.Tests.Unit;

public class AgroFormulasTests
{
    [Fact]
    public void EvaluateWorkability_ReturnsOptimal_WhenTopsoilDryAndNoHeavyRainForecast()
    {
        var series = CreateSeries(
            rain12h: 0.0,
            rain24h: 0.5,
            forecast24h: 1.0,
            forecast48h: 0.5,
            surfaceMoisture: 0.25,
            rootzoneMoisture: 0.42,
            ndvi: 0.74,
            esi: 0.68);

        var result = AgroFormulas.EvaluateWorkability(series);

        result.Status.ShouldBe("Optimal");
        result.SprayingSafe.ShouldBeTrue();
        result.Forecast48h.Count.ShouldBe(3);
        result.Forecast48h[0].Status.ShouldBe("Optimal");
        result.Forecast48h[1].Status.ShouldBe("Optimal");
        result.Forecast48h[2].Status.ShouldBe("Optimal");
    }

    [Fact]
    public void EvaluateWorkability_ReturnsMarginal_WhenSurfaceMoistureElevatedWithoutWashoutRain()
    {
        var series = CreateSeries(
            rain12h: 1.0,
            rain24h: 2.5,
            forecast24h: 2.0,
            forecast48h: 1.0,
            surfaceMoisture: 0.39,
            rootzoneMoisture: 0.45,
            ndvi: 0.72,
            esi: 0.65);

        var result = AgroFormulas.EvaluateWorkability(series);

        result.Status.ShouldBe("Marginal");
        result.SprayingSafe.ShouldBeTrue();
    }

    [Theory]
    [InlineData(11.0, 0.20, 1.0, false)]
    [InlineData(0.0, 0.20, 5.0, false)]
    [InlineData(0.0, 0.45, 1.0, true)]
    public void EvaluateWorkability_ReturnsBlocked_WhenThresholdsExceeded(
        double rain12h,
        double surfaceMoisture,
        double forecast24h,
        bool expectedSprayingSafe)
    {
        var series = CreateSeries(
            rain12h: rain12h,
            rain24h: rain12h,
            forecast24h: forecast24h,
            forecast48h: 1.0,
            surfaceMoisture: surfaceMoisture,
            rootzoneMoisture: 0.45,
            ndvi: 0.70,
            esi: 0.65);

        var result = AgroFormulas.EvaluateWorkability(series);

        result.Status.ShouldBe("Blocked");
        result.SprayingSafe.ShouldBe(expectedSprayingSafe);
    }

    [Fact]
    public void EvaluateStressAndIrrigation_DetectsHiddenWaterStress_WhenWdiHighAndNdviStable()
    {
        var series = CreateSeries(
            rain12h: 0.0,
            rain24h: 0.0,
            forecast24h: 0.0,
            forecast48h: 0.0,
            surfaceMoisture: 0.20,
            rootzoneMoisture: 0.19,
            ndvi: 0.74,
            esi: 0.32);

        var result = AgroFormulas.EvaluateStressAndIrrigation(
            CropType.Corn,
            "Field #2",
            series.DailySeries);

        result.WaterDeficitIndex.ShouldBeGreaterThan(0.65);
        result.IsHiddenStressDetected.ShouldBeTrue();
        result.IrrigationRecommended.ShouldBeTrue();
        result.RecommendedIrrigationMm.ShouldBeGreaterThan(0.0);
        result.Severity.ShouldBe("Warning");
        result.RecommendedWindowHours.ShouldBe(36);
    }

    [Fact]
    public void EvaluateStressAndIrrigation_ReturnsNoIrrigation_WhenRootzoneHealthy()
    {
        var series = CreateSeries(
            rain12h: 0.0,
            rain24h: 1.0,
            forecast24h: 1.0,
            forecast48h: 1.0,
            surfaceMoisture: 0.26,
            rootzoneMoisture: 0.48,
            ndvi: 0.75,
            esi: 0.72);

        var result = AgroFormulas.EvaluateStressAndIrrigation(
            CropType.Wheat,
            "Field #1",
            series.DailySeries);

        result.IrrigationRecommended.ShouldBeFalse();
        result.RecommendedIrrigationMm.ShouldBe(0.0);
        result.RecommendedWindowHours.ShouldBe(0);
        result.Severity.ShouldBe("Info");
    }

    [Fact]
    public void EvaluateBiomass_FlagsPestAnomaly_WhenNdviDropsWithoutDrought()
    {
        var baseline = Enumerable.Range(0, 14)
            .Select(i => new NasaDailyMetric(
                Date: new DateOnly(2026, 10, 1).AddDays(i),
                PrecipitationMm: 1.0,
                SurfaceMoisture: 0.28,
                RootzoneMoisture: 0.44,
                SolarRadiation: 15.0,
                Ndvi: i == 13 ? 0.56 : 0.76,
                Esi: 0.65))
            .ToList();

        var result = AgroFormulas.EvaluateBiomass("Field #4", baseline);

        result.IsDroughtPresent.ShouldBeFalse();
        result.IsAnomalyDetected.ShouldBeTrue();
        result.DeltaNdvi.ShouldBeLessThan(-0.12);
    }

    [Fact]
    public void EvaluateBiomass_DoesNotFlagPestAnomaly_WhenDroughtPresent()
    {
        var baseline = Enumerable.Range(0, 14)
            .Select(i => new NasaDailyMetric(
                Date: new DateOnly(2026, 10, 1).AddDays(i),
                PrecipitationMm: 0.0,
                SurfaceMoisture: 0.15,
                RootzoneMoisture: 0.22,
                SolarRadiation: 18.0,
                Ndvi: i == 13 ? 0.52 : 0.74,
                Esi: 0.35))
            .ToList();

        var result = AgroFormulas.EvaluateBiomass("Field #2", baseline);

        result.IsDroughtPresent.ShouldBeTrue();
        result.IsAnomalyDetected.ShouldBeFalse();
    }

    private static FieldSatelliteSeries CreateSeries(
        double rain12h,
        double rain24h,
        double forecast24h,
        double forecast48h,
        double surfaceMoisture,
        double rootzoneMoisture,
        double ndvi,
        double esi)
    {
        var metrics = Enumerable.Range(0, 14)
            .Select(i => new NasaDailyMetric(
                Date: new DateOnly(2026, 10, 15).AddDays(i),
                PrecipitationMm: i == 13 ? rain24h : 0.5,
                SurfaceMoisture: surfaceMoisture,
                RootzoneMoisture: rootzoneMoisture,
                SolarRadiation: 15.5,
                Ndvi: ndvi,
                Esi: esi))
            .ToList();

        return new FieldSatelliteSeries(
            DailySeries: metrics,
            RainLast12hMm: rain12h,
            RainLast24hMm: rain24h,
            RainForecast24hMm: forecast24h,
            RainForecast48hMm: forecast48h,
            DataSource: "MOCK_FIXTURE");
    }
}
