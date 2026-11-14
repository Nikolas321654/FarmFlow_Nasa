using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FarmFlow.Api.Features.Fields;
using FarmFlow.Api.Features.Predictions;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Database.Entities;
using NetTopologySuite.IO.Converters;
using Shouldly;
using Xunit;

namespace FarmFlow.Api.Tests.Integration;

[Collection(PostgresIntegrationCollection.Name)]
[Trait("Category", "Integration")]
public sealed class PredictionsEndpointsTests(FarmFlowWebFactory factory) : IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();

    public async ValueTask InitializeAsync() => await factory.ResetDatabaseAsync();

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    [Fact]
    public async Task SeededDemoFields_ServeSoilForecastAndYieldPredictions()
    {
        await factory.ExecuteWithDbAsync(db => DbSeeder.SeedAsync(db));
        using var guestClient = factory.CreateClient();

        var forecast = await guestClient.GetFromJsonAsync<ForecastSoilMoisture.Response>(
            "/api/fields/22222222-2222-2222-2222-222222222222/predictions/soil-forecast",
            JsonOptions,
            TestContext.Current.CancellationToken);

        forecast.ShouldNotBeNull();
        forecast.ModelName.ShouldBe("soil_forecast.onnx");
        forecast.ForecastSeries.Count.ShouldBe(7);
        forecast.ForecastSeries.Select(d => d.DayOffset).ShouldBe([1, 2, 3, 4, 5, 6, 7]);
        forecast.ForecastedDay3WaterDeficitIndex.ShouldBeGreaterThan(0.0);
        forecast.ProactiveRecommendation.ShouldNotBeNullOrWhiteSpace();

        var yield = await guestClient.GetFromJsonAsync<PredictYield.Response>(
            "/api/fields/11111111-1111-1111-1111-111111111111/predictions/yield",
            JsonOptions,
            TestContext.Current.CancellationToken);

        yield.ShouldNotBeNull();
        yield.CropType.ShouldBe(CropType.Wheat);
        yield.ModelName.ShouldBe("yield_model.onnx");
        yield.PredictedYieldTonsPerHa.ShouldBeGreaterThan(0.5);
        yield.EstimatedTotalHarvestTons.ShouldBeGreaterThan(0.0);
        yield.RegionalBaselineTonsPerHa.ShouldBe(4.30);
        yield.FeaturesUsed.PeakNdvi30d.ShouldBeGreaterThan(0.0);
    }

    [Fact]
    public async Task PrivateFieldPredictions_EnforceOwnershipIsolation()
    {
        var owner = await factory.SeedUserAsync("sub-pred-owner", "pred-owner@example.com", "Owner");
        var other = await factory.SeedUserAsync("sub-pred-other", "pred-other@example.com", "Other");

        using var guestClient = factory.CreateClient();
        using var ownerClient = await factory.CreateAuthenticatedClientAsync(owner.Id);
        using var otherClient = await factory.CreateAuthenticatedClientAsync(other.Id);

        var createResponse = await ownerClient.PostAsJsonAsync(
            "/api/fields",
            new
            {
                name = "Private Prediction Field",
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
            },
            TestContext.Current.CancellationToken);

        createResponse.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<FieldSummaryResponse>(
            JsonOptions,
            TestContext.Current.CancellationToken);
        created.ShouldNotBeNull();

        (await guestClient.GetAsync($"/api/fields/{created.Id}/predictions/yield", TestContext.Current.CancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await guestClient.GetAsync($"/api/fields/{created.Id}/predictions/soil-forecast", TestContext.Current.CancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);

        (await otherClient.GetAsync($"/api/fields/{created.Id}/predictions/yield", TestContext.Current.CancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await otherClient.GetAsync($"/api/fields/{created.Id}/predictions/soil-forecast", TestContext.Current.CancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);

        (await ownerClient.GetAsync($"/api/fields/{created.Id}/predictions/yield", TestContext.Current.CancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        (await ownerClient.GetAsync($"/api/fields/{created.Id}/predictions/soil-forecast", TestContext.Current.CancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    private static JsonSerializerOptions CreateJsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new GeoJsonConverterFactory());
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}
