using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FarmFlow.Api.Features.AgroAnalytics;
using FarmFlow.Api.Features.Predictions;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Ml;
using FarmFlow.Api.Infrastructure.Nasa;
using FarmFlow.Api.Infrastructure.Nasa.NasaModels;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Features.Alerts;

public static class GetActiveAlerts
{
    public record AlertItem(
        Guid Id,
        Guid FieldId,
        string FieldName,
        string AlertType,
        string Severity,
        string Title,
        string Message,
        DateTimeOffset CreatedAtUtc,
        bool? UserFeedbackAccurate);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/alerts", Handle)
           .WithTags("Alerts")
           .WithSummary("Returns prioritized active deterministic and 72h predictive alerts across all accessible fields.");

    public static async Task<IResult> Handle(
        ClaimsPrincipal principal,
        AppDbContext db,
        INasaClient nasaClient,
        OnnxModelRegistry modelRegistry,
        CancellationToken ct)
    {
        var fields = await db.Fields
            .AsNoTracking()
            .AccessibleTo(principal.GetUserIdOrNull())
            .OrderBy(f => f.Name)
            .ToListAsync(ct);

        if (fields.Count == 0)
        {
            return Results.Ok(Array.Empty<AlertItem>());
        }

        var feedbackByKey = await LoadLatestFeedbackAsync(db, fields, ct);
        var nowUtc = DateTimeOffset.UtcNow;
        var alerts = new List<AlertItem>();

        foreach (var field in fields)
        {
            var series = await nasaClient.GetFieldSeriesAsync(
                field.Centroid.Y, field.Centroid.X, field.DemoScenario, days: 30, ct: ct);

            EvaluateFieldAlerts(field, series, modelRegistry, feedbackByKey, nowUtc, alerts);
        }

        var sorted = alerts
            .OrderBy(a => SeverityRank(a.Severity))
            .ThenBy(a => a.FieldName, StringComparer.Ordinal)
            .ThenBy(a => a.AlertType, StringComparer.Ordinal)
            .ToList();

        return Results.Ok(sorted);
    }

    private static async Task<Dictionary<(Guid FieldId, string AlertType), bool>> LoadLatestFeedbackAsync(
        AppDbContext db,
        IReadOnlyList<Field> fields,
        CancellationToken ct)
    {
        var fieldIds = fields.Select(f => f.Id).ToList();
        var feedbacks = await db.AlertFeedbacks
            .AsNoTracking()
            .Where(af => fieldIds.Contains(af.FieldId))
            .OrderByDescending(af => af.CreatedAt)
            .ToListAsync(ct);

        var feedbackByKey = new Dictionary<(Guid FieldId, string AlertType), bool>();
        foreach (var fb in feedbacks)
        {
            feedbackByKey.TryAdd((fb.FieldId, fb.AlertType), fb.IsAccurate);
        }

        return feedbackByKey;
    }

    private static void EvaluateFieldAlerts(
        Field field,
        FieldSatelliteSeries series,
        OnnxModelRegistry modelRegistry,
        IReadOnlyDictionary<(Guid FieldId, string AlertType), bool> feedbackByKey,
        DateTimeOffset nowUtc,
        List<AlertItem> alerts)
    {
        var stress = AgroFormulas.EvaluateStressAndIrrigation(field.CropType, field.Name, series.DailySeries);
        if (stress.IrrigationRecommended || stress.IsHiddenStressDetected)
        {
            var severity = stress.Severity == "Info" ? "Warning" : stress.Severity;
            var title = stress.IsHiddenStressDetected
                ? "Hidden Water Stress — Preventive Irrigation Needed"
                : "Water Stress — Irrigation Recommended";

            alerts.Add(BuildAlert(field, "SmartIrrigation", severity, title, stress.Recommendation, nowUtc, feedbackByKey));
        }

        var sequence14 = ForecastSoilMoisture.NormalizeTo14Days(series.DailySeries);
        var forecast7Days = modelRegistry.ForecastSoil7Days(sequence14);
        if (forecast7Days.Count >= 3)
        {
            var (day3SmRoot, day3Esi) = forecast7Days[2];
            var day3Wdi = AgroFormulas.CalculateWaterDeficitIndex(day3SmRoot, day3Esi);
            if (day3Wdi > AgroFormulas.WaterDeficitAlertThreshold)
            {
                var severity = day3Wdi > 0.78 ? "Critical" : "Warning";
                var message =
                    $"{field.Name}: AI forecast projects rootzone moisture dropping to {day3SmRoot:0.00} in 72 hours (WDI {day3Wdi:0.00}). Schedule preventive irrigation within 48 hours.";

                alerts.Add(BuildAlert(field, "Proactive72hStress", severity, "72h Proactive Water Stress Forecast", message, nowUtc, feedbackByKey));
            }
        }

        var biomass = AgroFormulas.EvaluateBiomass(field.Name, series.DailySeries);
        if (biomass.IsAnomalyDetected)
        {
            alerts.Add(BuildAlert(
                field,
                "BiomassAnomaly",
                "Warning",
                $"Localized Biomass Drop ({biomass.DeltaPercent:0.1}%)",
                biomass.Recommendation,
                nowUtc,
                feedbackByKey));
        }

        var workability = AgroFormulas.EvaluateWorkability(series);
        if (workability.Status == "Blocked" || !workability.SprayingSafe)
        {
            var severity = workability.Status == "Blocked" ? "Warning" : "Info";
            var title = workability.Status == "Blocked"
                ? "Field Workability Blocked"
                : "Spraying Window Restricted";

            alerts.Add(BuildAlert(field, "WorkabilityBlocked", severity, title, $"{field.Name}: {workability.Recommendation}", nowUtc, feedbackByKey));
        }
        else if (workability.Status == "Marginal")
        {
            alerts.Add(BuildAlert(
                field,
                "WorkabilityMarginal",
                "Info",
                "Marginal Field Workability Window",
                $"{field.Name}: {workability.Recommendation}",
                nowUtc,
                feedbackByKey));
        }
    }

    private static AlertItem BuildAlert(
        Field field,
        string alertType,
        string severity,
        string title,
        string message,
        DateTimeOffset createdAtUtc,
        IReadOnlyDictionary<(Guid FieldId, string AlertType), bool> feedbackByKey)
    {
        bool? feedback = feedbackByKey.TryGetValue((field.Id, alertType), out var isAccurate)
            ? isAccurate
            : null;

        return new AlertItem(
            Id: CreateDeterministicAlertId(field.Id, alertType),
            FieldId: field.Id,
            FieldName: field.Name,
            AlertType: alertType,
            Severity: severity,
            Title: title,
            Message: message,
            CreatedAtUtc: createdAtUtc,
            UserFeedbackAccurate: feedback);
    }

    private static Guid CreateDeterministicAlertId(Guid fieldId, string alertType)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{fieldId:N}:{alertType}"));
        return new Guid(hash.AsSpan(0, 16));
    }

    private static int SeverityRank(string severity) => severity switch
    {
        "Critical" => 0,
        "Warning" => 1,
        _ => 2
    };
}
