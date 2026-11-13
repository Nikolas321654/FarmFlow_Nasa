using NetTopologySuite.Geometries;

namespace FarmFlow.Api.Infrastructure.Spatial;

public static class GeoCalculator
{
    public const int Wgs84Srid = 4326;
    private const double EarthRadiusMeters = 6_378_137.0;
    private const double SquareMetersPerHectare = 10_000.0;

    public static void ValidatePolygon(Polygon? polygon)
    {
        ArgumentNullException.ThrowIfNull(polygon);

        if (polygon.IsEmpty)
        {
            throw new ArgumentException("Field boundary polygon cannot be empty.", nameof(polygon));
        }

        if (!polygon.IsValid)
        {
            throw new ArgumentException("Field boundary polygon geometry is invalid (e.g., self-intersecting).", nameof(polygon));
        }

        var outOfBounds = polygon.Coordinates
            .FirstOrDefault(c => c.X is < -180.0 or > 180.0 || c.Y is < -90.0 or > 90.0);

        if (outOfBounds is not null)
        {
            throw new ArgumentException(
                $"Coordinate ({outOfBounds.X}, {outOfBounds.Y}) is outside valid WGS 84 bounds.", nameof(polygon));
        }

        polygon.SRID = Wgs84Srid;
    }

    public static Point CalculateCentroid(Polygon polygon)
    {
        ArgumentNullException.ThrowIfNull(polygon);
        var centroid = polygon.Centroid;
        centroid.SRID = Wgs84Srid;
        return centroid;
    }

    public static double CalculateAreaHectares(Polygon polygon)
    {
        ArgumentNullException.ThrowIfNull(polygon);
        if (polygon.IsEmpty)
        {
            return 0.0;
        }

        var areaSquareMeters = RingAreaSquareMeters(polygon.ExteriorRing);
        for (var i = 0; i < polygon.NumInteriorRings; i++)
        {
            areaSquareMeters -= RingAreaSquareMeters(polygon.GetInteriorRingN(i));
        }

        return Math.Round(Math.Max(0.0, areaSquareMeters) / SquareMetersPerHectare, 2);
    }

    private static double RingAreaSquareMeters(LineString ring)
    {
        var coords = ring.Coordinates;
        var count = coords.Length > 1 && coords[0].Equals2D(coords[^1])
            ? coords.Length - 1
            : coords.Length;

        if (count < 3)
        {
            return 0.0;
        }

        double sum = 0.0;
        for (var i = 0; i < count; i++)
        {
            var lower = coords[i];
            var middle = coords[(i + 1) % count];
            var upper = coords[(i + 2) % count];

            var lonDiffRad = DegreesToRadians(upper.X - lower.X);
            var latMiddleRad = DegreesToRadians(middle.Y);

            sum += lonDiffRad * Math.Sin(latMiddleRad);
        }

        return Math.Abs(sum * EarthRadiusMeters * EarthRadiusMeters / 2.0);
    }

    private static double DegreesToRadians(double degrees) => degrees * (Math.PI / 180.0);
}
