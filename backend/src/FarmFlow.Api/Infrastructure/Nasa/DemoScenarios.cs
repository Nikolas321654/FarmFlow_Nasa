namespace FarmFlow.Api.Infrastructure.Nasa;

public static class DemoScenarios
{
    public const string Optimal = "optimal";
    public const string WaterStress = "water_stress";
    public const string RainBlocked = "rain_blocked";
    public const string PestAnomaly = "pest_anomaly";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Optimal,
        WaterStress,
        RainBlocked,
        PestAnomaly
    };

    private static readonly Dictionary<string, string> Aliases = new(StringComparer.OrdinalIgnoreCase)
    {
        [Optimal] = Optimal,
        ["healthy"] = Optimal,
        [WaterStress] = WaterStress,
        ["stress"] = WaterStress,
        [RainBlocked] = RainBlocked,
        ["blocked"] = RainBlocked,
        ["rain"] = RainBlocked,
        [PestAnomaly] = PestAnomaly,
        ["pest"] = PestAnomaly,
        ["anomaly"] = PestAnomaly
    };

    public static string Normalize(string? scenario, out bool isRecognized)
    {
        if (string.IsNullOrWhiteSpace(scenario))
        {
            isRecognized = true;
            return Optimal;
        }

        var key = scenario.Trim().ToLowerInvariant().Replace('-', '_');
        if (Aliases.TryGetValue(key, out var canonical))
        {
            isRecognized = true;
            return canonical;
        }

        isRecognized = false;
        return Optimal;
    }
}
