using FarmFlow.Api.Features.AgroAnalytics;
using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Nasa;
using NetTopologySuite.Geometries;

namespace FarmFlow.Api.Features.Fields;

public record FieldSummaryResponse(
    Guid Id,
    string Name,
    CropType CropType,
    DateOnly PlantedAt,
    double AreaHectares,
    double CentroidLat,
    double CentroidLon,
    string WorkabilityStatus,
    bool HasActiveStressAlert,
    bool HasBiomassAnomaly,
    Polygon Boundary,
    bool IsDemo = false);

internal static class FieldSummaryMapper
{
    public static async Task<FieldSummaryResponse> ToSummaryAsync(
        Field field,
        INasaClient nasaClient,
        CancellationToken ct)
    {
        var series = await nasaClient.GetFieldSeriesAsync(
            field.Centroid.Y, field.Centroid.X, field.DemoScenario, ct: ct);

        var workability = AgroFormulas.EvaluateWorkability(series);
        var stress = AgroFormulas.EvaluateStressAndIrrigation(field.CropType, field.Name, series.DailySeries);
        var biomass = AgroFormulas.EvaluateBiomass(field.Name, series.DailySeries);

        return new FieldSummaryResponse(
            Id: field.Id,
            Name: field.Name,
            CropType: field.CropType,
            PlantedAt: field.PlantedAt,
            AreaHectares: field.AreaHectares,
            CentroidLat: Math.Round(field.Centroid.Y, 6),
            CentroidLon: Math.Round(field.Centroid.X, 6),
            WorkabilityStatus: workability.Status,
            HasActiveStressAlert: stress.IrrigationRecommended || stress.IsHiddenStressDetected,
            HasBiomassAnomaly: biomass.IsAnomalyDetected,
            Boundary: field.Boundary,
            IsDemo: field.IsDemo);
    }
}
