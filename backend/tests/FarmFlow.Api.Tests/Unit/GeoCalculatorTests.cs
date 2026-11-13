using FarmFlow.Api.Infrastructure.Spatial;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using Shouldly;
using Xunit;

namespace FarmFlow.Api.Tests.Unit;

public class GeoCalculatorTests
{
    private static readonly GeometryFactory GeometryFactory =
        NtsGeometryServices.Instance.CreateGeometryFactory(srid: GeoCalculator.Wgs84Srid);

    [Fact]
    public void ValidateAndMeasurePolygon_ComputesPositiveHectaresAndCentroid_ForValidUkrainianField()
    {
        var polygon = GeometryFactory.CreatePolygon(
        [
            new Coordinate(31.175, 48.448),
            new Coordinate(31.190, 48.448),
            new Coordinate(31.190, 48.455),
            new Coordinate(31.175, 48.455),
            new Coordinate(31.175, 48.448)
        ]);

        GeoCalculator.ValidatePolygon(polygon);
        var areaHectares = GeoCalculator.CalculateAreaHectares(polygon);
        var centroid = GeoCalculator.CalculateCentroid(polygon);

        polygon.SRID.ShouldBe(4326);
        areaHectares.ShouldBeInRange(75.0, 105.0);
        centroid.SRID.ShouldBe(4326);
        centroid.X.ShouldBeInRange(31.175, 31.190);
        centroid.Y.ShouldBeInRange(48.448, 48.455);
    }

    [Fact]
    public void ValidatePolygon_ThrowsArgumentException_WhenSelfIntersecting()
    {
        var bowtie = GeometryFactory.CreatePolygon(
        [
            new Coordinate(31.0, 48.0),
            new Coordinate(31.1, 48.1),
            new Coordinate(31.0, 48.1),
            new Coordinate(31.1, 48.0),
            new Coordinate(31.0, 48.0)
        ]);

        Should.Throw<ArgumentException>(() => GeoCalculator.ValidatePolygon(bowtie));
    }

    [Fact]
    public void ValidatePolygon_ThrowsArgumentException_WhenCoordinatesOutsideWgs84Bounds()
    {
        var outOfBounds = GeometryFactory.CreatePolygon(
        [
            new Coordinate(181.0, 48.0),
            new Coordinate(182.0, 48.0),
            new Coordinate(182.0, 48.1),
            new Coordinate(181.0, 48.1),
            new Coordinate(181.0, 48.0)
        ]);

        Should.Throw<ArgumentException>(() => GeoCalculator.ValidatePolygon(outOfBounds));
    }
}
