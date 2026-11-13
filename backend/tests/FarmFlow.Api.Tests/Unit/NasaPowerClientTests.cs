using System.Net;
using FarmFlow.Api.Infrastructure.Nasa;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Shouldly;
using Xunit;

namespace FarmFlow.Api.Tests.Unit;

public class NasaPowerClientTests
{
    [Fact]
    public async Task GetFieldSeriesAsync_ParsesValidPayload_AndIncludesAllRequiredQueryParameters()
    {
        var json = BuildSamplePowerJson(rootzoneDay2: 0.43);
        var handler = TestHttpMessageHandler.FromJson(HttpStatusCode.OK, json);
        var client = CreateClient(handler);

        var series = await client.GetFieldSeriesAsync(48.45, 31.18, days: 14, ct: TestContext.Current.CancellationToken);

        series.DataSource.ShouldBe("NASA_POWER_LIVE");
        series.DailySeries.Count.ShouldBe(2);
        series.DailySeries[^1].RootzoneMoisture.ShouldBe(0.43);
        series.DailySeries[^1].Ndvi.ShouldBeInRange(0.15, 0.90);
        series.DailySeries[^1].Esi.ShouldBeInRange(0.10, 0.95);

        handler.LastRequestUri.ShouldNotBeNull();
        var query = handler.LastRequestUri.Query;
        query.ShouldContain("parameters=PRECTOTCORR,GWETTOP,GWETROOT,ALLSKY_SFC_SW_DWN");
        query.ShouldContain("community=AG");
        query.ShouldContain("latitude=48.4500");
        query.ShouldContain("longitude=31.1800");
        query.ShouldContain("start=");
        query.ShouldContain("end=");
    }

    [Fact]
    public async Task GetFieldSeriesAsync_ThrowsInvalidDataException_WhenMissingSentinelReturned()
    {
        var json = BuildSamplePowerJson(rootzoneDay2: -999.0);
        var handler = TestHttpMessageHandler.FromJson(HttpStatusCode.OK, json);
        var client = CreateClient(handler);

        await Should.ThrowAsync<InvalidDataException>(async () =>
            await client.GetFieldSeriesAsync(48.45, 31.18, ct: TestContext.Current.CancellationToken));
    }

    private static NasaPowerClient CreateClient(HttpMessageHandler handler)
    {
        var httpClient = new HttpClient(handler);
        var options = Options.Create(new NasaSettings());
        return new NasaPowerClient(httpClient, options, NullLogger<NasaPowerClient>.Instance);
    }

    internal static string BuildSamplePowerJson(double rootzoneDay2) =>
        $$"""
          {
            "properties": {
              "parameter": {
                "PRECTOTCORR": { "20261101": 0.0, "20261102": 1.2 },
                "GWETTOP": { "20261101": 0.25, "20261102": 0.28 },
                "GWETROOT": { "20261101": 0.42, "20261102": {{rootzoneDay2.ToString(System.Globalization.CultureInfo.InvariantCulture)}} },
                "ALLSKY_SFC_SW_DWN": { "20261101": 14.5, "20261102": 15.1 }
              }
            }
          }
          """;
}
