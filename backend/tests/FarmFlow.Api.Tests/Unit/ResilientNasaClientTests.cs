using System.Net;
using System.Text;
using FarmFlow.Api.Infrastructure.Nasa;
using FarmFlow.Api.Infrastructure.Nasa.NasaModels;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Shouldly;
using Xunit;

namespace FarmFlow.Api.Tests.Unit;

public class ResilientNasaClientTests
{
    [Fact]
    public async Task GetFieldSeriesAsync_UsesMockDirectly_WhenDemoScenarioProvided()
    {
        var handler = TestHttpMessageHandler.FromJson(HttpStatusCode.OK, NasaPowerClientTests.BuildSamplePowerJson(0.45));
        var sut = CreateSut(handler, forceMock: false, timeoutSeconds: 3.0);

        var result = await sut.GetFieldSeriesAsync(48.45, 31.18, DemoScenarios.WaterStress, ct: TestContext.Current.CancellationToken);

        result.DataSource.ShouldBe("MOCK_FIXTURE");
        handler.CallCount.ShouldBe(0);
    }

    [Fact]
    public async Task GetFieldSeriesAsync_FallsBackToMock_WhenPowerApiReturnsServerError()
    {
        var handler = TestHttpMessageHandler.FromJson(HttpStatusCode.InternalServerError, "{}");
        var sut = CreateSut(handler, forceMock: false, timeoutSeconds: 3.0);

        var result = await sut.GetFieldSeriesAsync(48.45, 31.18, ct: TestContext.Current.CancellationToken);

        result.DataSource.ShouldBe("MOCK_FIXTURE");
        handler.CallCount.ShouldBe(1);
    }

    [Fact]
    public async Task GetFieldSeriesAsync_FallsBackToMock_WhenPowerApiReturnsMissingSentinel()
    {
        var handler = TestHttpMessageHandler.FromJson(HttpStatusCode.OK, NasaPowerClientTests.BuildSamplePowerJson(-999.0));
        var sut = CreateSut(handler, forceMock: false, timeoutSeconds: 3.0);

        var result = await sut.GetFieldSeriesAsync(48.45, 31.18, ct: TestContext.Current.CancellationToken);

        result.DataSource.ShouldBe("MOCK_FIXTURE");
        handler.CallCount.ShouldBe(1);
    }

    [Fact]
    public async Task GetFieldSeriesAsync_FallsBackToMock_WhenPowerApiExceedsTimeout()
    {
        var handler = new TestHttpMessageHandler(async (_, ct) =>
        {
            await Task.Delay(TimeSpan.FromSeconds(5), ct);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(NasaPowerClientTests.BuildSamplePowerJson(0.45), Encoding.UTF8, "application/json")
            };
        });
        var sut = CreateSut(handler, forceMock: false, timeoutSeconds: 0.5);

        var result = await sut.GetFieldSeriesAsync(48.45, 31.18, ct: TestContext.Current.CancellationToken);

        result.DataSource.ShouldBe("MOCK_FIXTURE");
    }

    [Fact]
    public async Task GetFieldSeriesAsync_CachesByRoundedCoordinates_InHybridCache()
    {
        var handler = TestHttpMessageHandler.FromJson(HttpStatusCode.OK, NasaPowerClientTests.BuildSamplePowerJson(0.44));
        var sut = CreateSut(handler, forceMock: false, timeoutSeconds: 3.0);

        var first = await sut.GetFieldSeriesAsync(48.4511, 31.1811, ct: TestContext.Current.CancellationToken);
        var second = await sut.GetFieldSeriesAsync(48.4544, 31.1844, ct: TestContext.Current.CancellationToken);

        first.DataSource.ShouldBe("NASA_POWER_LIVE");
        second.DataSource.ShouldBe("NASA_POWER_LIVE");
        handler.CallCount.ShouldBe(1);
    }

    private static ResilientNasaClient CreateSut(HttpMessageHandler handler, bool forceMock, double timeoutSeconds)
    {
        var settings = Options.Create(new NasaSettings
        {
            ForceMock = forceMock,
            TimeoutSeconds = timeoutSeconds,
            CacheDurationHours = 6
        });

        var powerClient = new NasaPowerClient(new HttpClient(handler), settings, NullLogger<NasaPowerClient>.Instance);
        var mockClient = new MockNasaClient(new FakeFixtureStore(), NullLogger<MockNasaClient>.Instance);

        var services = new ServiceCollection();
        services.AddMemoryCache();
        services.AddHybridCache();
        var cache = services.BuildServiceProvider().GetRequiredService<HybridCache>();

        return new ResilientNasaClient(powerClient, mockClient, cache, settings, NullLogger<ResilientNasaClient>.Instance);
    }

    private sealed class FakeFixtureStore : INasaFixtureStore
    {
        public NasaFixtureData GetFixture(string scenarioKey)
        {
            var records = Enumerable.Range(-13, 14)
                .Select(offset => new NasaFixtureRecord(offset, 0.2, 0.25, 0.42, 15.0, 0.74, 0.65))
                .ToList();

            return new NasaFixtureData(scenarioKey, 0.0, 0.2, 1.0, 0.5, records);
        }
    }
}
