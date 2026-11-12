using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FarmFlow.Api.Features.AgroAnalytics;
using FarmFlow.Api.Features.Fields;
using FarmFlow.Api.Infrastructure.Database;
using NetTopologySuite.IO.Converters;
using Shouldly;
using Xunit;

namespace FarmFlow.Api.Tests.Integration;

[Collection(PostgresIntegrationCollection.Name)]
[Trait("Category", "Integration")]
public sealed class FieldsAndAgroEndpointsTests(FarmFlowWebFactory factory) : IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();
    private readonly HttpClient _client = factory.CreateClient();

    public async ValueTask InitializeAsync() => await factory.ResetDatabaseAsync();

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    [Fact]
    public async Task CreateGetAndListFields_PersistsPostGisGeometryAndComputesAreaAndCentroid()
    {
        var payload = new
        {
            name = "Field #5 — South Valley",
            cropType = "Corn",
            plantedAt = "2026-05-10",
            boundary = new
            {
                type = "Polygon",
                coordinates = new[]
                {
                    new[]
                    {
                        new[] { 30.512, 49.210 },
                        new[] { 30.528, 49.210 },
                        new[] { 30.528, 49.222 },
                        new[] { 30.512, 49.222 },
                        new[] { 30.512, 49.210 }
                    }
                }
            }
        };

        var createResponse = await _client.PostAsJsonAsync("/api/fields", payload, TestContext.Current.CancellationToken);
        createResponse.StatusCode.ShouldBe(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<FieldSummaryResponse>(JsonOptions, TestContext.Current.CancellationToken);
        created.ShouldNotBeNull();
        created.Name.ShouldBe("Field #5 — South Valley");
        created.AreaHectares.ShouldBeGreaterThan(100.0);
        created.CentroidLat.ShouldBeInRange(49.210, 49.222);
        created.CentroidLon.ShouldBeInRange(30.512, 30.528);

        var getResponse = await _client.GetFromJsonAsync<FieldSummaryResponse>($"/api/fields/{created.Id}", JsonOptions, TestContext.Current.CancellationToken);
        getResponse.ShouldNotBeNull();
        getResponse.Id.ShouldBe(created.Id);

        var listResponse = await _client.GetFromJsonAsync<List<FieldSummaryResponse>>("/api/fields", JsonOptions, TestContext.Current.CancellationToken);
        listResponse.ShouldNotBeNull();
        listResponse.Count.ShouldBe(1);
    }

    [Fact]
    public async Task CreateField_ReturnsValidationProblem_WhenBoundarySelfIntersects()
    {
        var invalidPayload = new
        {
            name = "Broken Polygon Field",
            cropType = "Wheat",
            plantedAt = "2026-09-05",
            boundary = new
            {
                type = "Polygon",
                coordinates = new[]
                {
                    new[]
                    {
                        new[] { 31.0, 48.0 },
                        new[] { 31.1, 48.1 },
                        new[] { 31.0, 48.1 },
                        new[] { 31.1, 48.0 },
                        new[] { 31.0, 48.0 }
                    }
                }
            }
        };

        var response = await _client.PostAsJsonAsync("/api/fields", invalidPayload, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteField_RemovesFieldAndReturnsNotFoundAfterwards()
    {
        await factory.ExecuteWithDbAsync(db => DbSeeder.SeedAsync(db));
        var fieldId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var deleteResponse = await _client.DeleteAsync($"/api/fields/{fieldId}", TestContext.Current.CancellationToken);
        deleteResponse.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var getAfterDelete = await _client.GetAsync($"/api/fields/{fieldId}", TestContext.Current.CancellationToken);
        getAfterDelete.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task SeededDemoFields_ServeScenarioSpecificAgroAnalyticsEndpoints()
    {
        await factory.ExecuteWithDbAsync(db => DbSeeder.SeedAsync(db));

        var waterStress = await _client.GetFromJsonAsync<GetEarlyStressAlert.Response>(
            "/api/fields/22222222-2222-2222-2222-222222222222/stress",
            JsonOptions,
            TestContext.Current.CancellationToken);
        waterStress.ShouldNotBeNull();
        waterStress.IsHiddenStressDetected.ShouldBeTrue();
        waterStress.IrrigationRecommended.ShouldBeTrue();

        var rainBlocked = await _client.GetFromJsonAsync<GetWorkabilityWindow.Response>(
            "/api/fields/33333333-3333-3333-3333-333333333333/workability",
            JsonOptions,
            TestContext.Current.CancellationToken);
        rainBlocked.ShouldNotBeNull();
        rainBlocked.Status.ShouldBe("Blocked");
        rainBlocked.SprayingSafe.ShouldBeFalse();

        var pestAnomaly = await _client.GetFromJsonAsync<GetBiomassTrend.Response>(
            "/api/fields/44444444-4444-4444-4444-444444444444/biomass",
            JsonOptions,
            TestContext.Current.CancellationToken);
        pestAnomaly.ShouldNotBeNull();
        pestAnomaly.IsAnomalyDetected.ShouldBeTrue();

        var dashboard = await _client.GetFromJsonAsync<GetFieldDashboard.Response>(
            "/api/fields/11111111-1111-1111-1111-111111111111/dashboard?days=14",
            JsonOptions,
            TestContext.Current.CancellationToken);
        dashboard.ShouldNotBeNull();
        dashboard.TimeSeries.Count.ShouldBe(14);
        dashboard.ImpactMetrics.EstimatedWaterSavedM3PerHa.ShouldBeGreaterThan(0.0);
    }

    private static JsonSerializerOptions CreateJsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new GeoJsonConverterFactory());
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}
