using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FarmFlow.Api.Features.Alerts;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Nasa;
using FarmFlow.Api.Infrastructure.Spatial;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO.Converters;
using Shouldly;
using Xunit;

namespace FarmFlow.Api.Tests.Integration;

[Collection(PostgresIntegrationCollection.Name)]
[Trait("Category", "Integration")]
public sealed class AlertsEndpointsTests(FarmFlowWebFactory factory) : IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();

    public async ValueTask InitializeAsync() => await factory.ResetDatabaseAsync();

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    [Fact]
    public async Task SeededDemoFields_ReturnPrioritizedAlertsSortedBySeverity()
    {
        var waterStressFieldId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var rainBlockedFieldId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var pestAnomalyFieldId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        await factory.ExecuteWithDbAsync(async db =>
        {
            await DbSeeder.SeedAsync(db);
            db.AlertFeedbacks.Add(new AlertFeedback
            {
                Id = Guid.NewGuid(),
                FieldId = waterStressFieldId,
                AlertType = "SmartIrrigation",
                IsAccurate = true,
                Comment = "Confirmed dry rootzone",
                CreatedAt = DateTimeOffset.UtcNow
            });
            await db.SaveChangesAsync();
        });

        using var guestClient = factory.CreateClient();

        var firstAlerts = await guestClient.GetFromJsonAsync<List<GetActiveAlerts.AlertItem>>(
            "/api/alerts",
            JsonOptions,
            TestContext.Current.CancellationToken);

        firstAlerts.ShouldNotBeNull();
        firstAlerts.Count.ShouldBeGreaterThanOrEqualTo(3);

        var ranks = firstAlerts.Select(a => SeverityRank(a.Severity)).ToList();
        ranks.ShouldBe(ranks.OrderBy(r => r).ToList());

        var irrigationAlert = firstAlerts.FirstOrDefault(a =>
            a.FieldId == waterStressFieldId && a.AlertType == "SmartIrrigation");
        irrigationAlert.ShouldNotBeNull();
        irrigationAlert.UserFeedbackAccurate.ShouldBe(true);

        var workabilityAlert = firstAlerts.FirstOrDefault(a =>
            a.FieldId == rainBlockedFieldId && a.AlertType == "WorkabilityBlocked");
        workabilityAlert.ShouldNotBeNull();
        workabilityAlert.UserFeedbackAccurate.ShouldBeNull();

        var biomassAlert = firstAlerts.FirstOrDefault(a =>
            a.FieldId == pestAnomalyFieldId && a.AlertType == "BiomassAnomaly");
        biomassAlert.ShouldNotBeNull();
        biomassAlert.Severity.ShouldBe("Warning");

        var secondAlerts = await guestClient.GetFromJsonAsync<List<GetActiveAlerts.AlertItem>>(
            "/api/alerts",
            JsonOptions,
            TestContext.Current.CancellationToken);

        secondAlerts.ShouldNotBeNull();
        secondAlerts.Select(a => a.Id).ShouldBe(firstAlerts.Select(a => a.Id));
    }

    [Fact]
    public async Task PrivateFieldAlerts_EnforceOwnershipIsolation()
    {
        var owner = await factory.SeedUserAsync("sub-alert-owner", "alert-owner@example.com", "Owner");
        var other = await factory.SeedUserAsync("sub-alert-other", "alert-other@example.com", "Other");
        var privateFieldId = Guid.NewGuid();

        await factory.ExecuteWithDbAsync(async db =>
        {
            var geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: GeoCalculator.Wgs84Srid);
            var boundary = geometryFactory.CreatePolygon(
            [
                new Coordinate(30.512, 49.210),
                new Coordinate(30.528, 49.210),
                new Coordinate(30.528, 49.222),
                new Coordinate(30.512, 49.222),
                new Coordinate(30.512, 49.210)
            ]);

            db.Fields.Add(new Field
            {
                Id = privateFieldId,
                OwnerId = owner.Id,
                IsDemo = false,
                Name = "Owner Private Stress Field",
                CropType = CropType.Corn,
                PlantedAt = new DateOnly(2026, 5, 10),
                Boundary = boundary,
                Centroid = GeoCalculator.CalculateCentroid(boundary),
                AreaHectares = GeoCalculator.CalculateAreaHectares(boundary),
                DemoScenario = DemoScenarios.WaterStress
            });
            await db.SaveChangesAsync();
        });

        using var guestClient = factory.CreateClient();
        using var ownerClient = await factory.CreateAuthenticatedClientAsync(owner.Id);
        using var otherClient = await factory.CreateAuthenticatedClientAsync(other.Id);

        var ownerAlerts = await ownerClient.GetFromJsonAsync<List<GetActiveAlerts.AlertItem>>(
            "/api/alerts",
            JsonOptions,
            TestContext.Current.CancellationToken);
        ownerAlerts.ShouldNotBeNull();
        ownerAlerts.ShouldContain(a => a.FieldId == privateFieldId);

        var guestAlerts = await guestClient.GetFromJsonAsync<List<GetActiveAlerts.AlertItem>>(
            "/api/alerts",
            JsonOptions,
            TestContext.Current.CancellationToken);
        guestAlerts.ShouldNotBeNull();
        guestAlerts.ShouldNotContain(a => a.FieldId == privateFieldId);

        var otherAlerts = await otherClient.GetFromJsonAsync<List<GetActiveAlerts.AlertItem>>(
            "/api/alerts",
            JsonOptions,
            TestContext.Current.CancellationToken);
        otherAlerts.ShouldNotBeNull();
        otherAlerts.ShouldNotContain(a => a.FieldId == privateFieldId);
    }

    private static int SeverityRank(string severity) => severity switch
    {
        "Critical" => 0,
        "Warning" => 1,
        _ => 2
    };

    private static JsonSerializerOptions CreateJsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new GeoJsonConverterFactory());
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}
