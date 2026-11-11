using System.Text.Json;
using FarmFlow.Api.Infrastructure.Nasa.NasaModels;

namespace FarmFlow.Api.Infrastructure.Nasa;

public class FileNasaFixtureStore : INasaFixtureStore
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly Dictionary<string, NasaFixtureData> _fixtures;
    private readonly ILogger<FileNasaFixtureStore> _logger;

    public FileNasaFixtureStore(IWebHostEnvironment env, ILogger<FileNasaFixtureStore> logger)
    {
        _logger = logger;
        _fixtures = LoadFixtures(env.ContentRootPath);
    }

    public NasaFixtureData GetFixture(string scenarioKey)
    {
        if (_fixtures.TryGetValue(scenarioKey, out var fixture))
        {
            return fixture;
        }

        _logger.LogWarning("Scenario '{ScenarioKey}' not found in fixture store. Falling back to '{Default}'.",
            scenarioKey, DemoScenarios.Optimal);

        return _fixtures[DemoScenarios.Optimal];
    }

    private Dictionary<string, NasaFixtureData> LoadFixtures(string contentRoot)
    {
        var store = new Dictionary<string, NasaFixtureData>(StringComparer.OrdinalIgnoreCase);

        foreach (var scenario in DemoScenarios.All)
        {
            var candidates = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "Infrastructure", "Nasa", "Fixtures", $"{scenario}.json"),
                Path.Combine(contentRoot, "Infrastructure", "Nasa", "Fixtures", $"{scenario}.json")
            };

            var path = candidates.FirstOrDefault(File.Exists)
                ?? throw new FileNotFoundException($"Critical: NASA fixture file for '{scenario}' was not found.");

            var json = File.ReadAllText(path);
            var data = JsonSerializer.Deserialize<NasaFixtureData>(json, JsonOptions)
                ?? throw new InvalidOperationException($"Failed to deserialize fixture for '{scenario}'.");

            store[scenario] = data;
        }

        _logger.LogInformation("Loaded {Count} NASA scenario fixtures into memory cache.", store.Count);
        return store;
    }
}
