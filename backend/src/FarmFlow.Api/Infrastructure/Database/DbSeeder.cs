using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Nasa;
using FarmFlow.Api.Infrastructure.Spatial;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;

namespace FarmFlow.Api.Infrastructure.Database;

public static class DbSeeder
{
    private static readonly GeometryFactory GeometryFactory =
        NtsGeometryServices.Instance.CreateGeometryFactory(srid: GeoCalculator.Wgs84Srid);

    private sealed record SeedFieldSpec(
        Guid Id,
        string Name,
        CropType CropType,
        DateOnly PlantedAt,
        string DemoScenario,
        (double Lon, double Lat)[] Ring);

    private static readonly SeedFieldSpec[] DemoFields =
    [
        new(
            Id: Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name: "Field #1 — Central Wheat",
            CropType: CropType.Wheat,
            PlantedAt: new DateOnly(2026, 9, 5),
            DemoScenario: DemoScenarios.Optimal,
            Ring: [(31.175, 48.448), (31.190, 48.448), (31.190, 48.455), (31.175, 48.455), (31.175, 48.448)]),
        new(
            Id: Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name: "Field #2 — North Corn",
            CropType: CropType.Corn,
            PlantedAt: new DateOnly(2026, 5, 10),
            DemoScenario: DemoScenarios.WaterStress,
            Ring: [(33.420, 49.580), (33.434, 49.580), (33.434, 49.588), (33.420, 49.588), (33.420, 49.580)]),
        new(
            Id: Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Name: "Field #3 — West Sunflower",
            CropType: CropType.Sunflower,
            PlantedAt: new DateOnly(2026, 4, 28),
            DemoScenario: DemoScenarios.RainBlocked,
            Ring: [(28.450, 49.230), (28.464, 49.230), (28.464, 49.238), (28.450, 49.238), (28.450, 49.230)]),
        new(
            Id: Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Name: "Field #4 — South Soy",
            CropType: CropType.Soy,
            PlantedAt: new DateOnly(2026, 5, 15),
            DemoScenario: DemoScenarios.PestAnomaly,
            Ring: [(31.950, 47.050), (31.964, 47.050), (31.964, 47.058), (31.950, 47.058), (31.950, 47.050)])
    ];

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        var demoIds = DemoFields.Select(d => d.Id).ToArray();
        var existingIds = await db.Fields
            .Where(f => demoIds.Contains(f.Id))
            .Select(f => f.Id)
            .ToHashSetAsync(ct);

        var missingFields = DemoFields
            .Where(spec => !existingIds.Contains(spec.Id))
            .Select(BuildField)
            .ToList();

        if (missingFields.Count == 0)
        {
            return;
        }

        await db.Fields.AddRangeAsync(missingFields, ct);
        await db.SaveChangesAsync(ct);
    }

    private static Field BuildField(SeedFieldSpec spec)
    {
        var coordinates = spec.Ring.Select(p => new Coordinate(p.Lon, p.Lat)).ToArray();
        var boundary = GeometryFactory.CreatePolygon(coordinates);
        GeoCalculator.ValidatePolygon(boundary);

        return new Field
        {
            Id = spec.Id,
            Name = spec.Name,
            CropType = spec.CropType,
            PlantedAt = spec.PlantedAt,
            Boundary = boundary,
            Centroid = GeoCalculator.CalculateCentroid(boundary),
            AreaHectares = GeoCalculator.CalculateAreaHectares(boundary),
            DemoScenario = spec.DemoScenario,
            OwnerId = null,
            IsDemo = true
        };
    }
}
