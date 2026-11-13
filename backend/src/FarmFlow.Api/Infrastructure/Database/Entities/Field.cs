using NetTopologySuite.Geometries;

namespace FarmFlow.Api.Infrastructure.Database.Entities;

public class Field
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public CropType CropType { get; set; }
    public DateOnly PlantedAt { get; set; }
    public Polygon Boundary { get; set; } = null!;
    public Point Centroid { get; set; } = null!;
    public double AreaHectares { get; set; }
    public string? DemoScenario { get; set; }
    public Guid? OwnerId { get; set; }
    public User? Owner { get; set; }
    public bool IsDemo { get; set; }
}
