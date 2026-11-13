namespace FarmFlow.Api.Infrastructure.Database.Entities;

public class User
{
    public Guid Id { get; set; }
    public string GoogleSubjectId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string GoogleDisplayName { get; set; } = string.Empty;
    public string? CustomDisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }

    public string EffectiveDisplayName =>
        string.IsNullOrWhiteSpace(CustomDisplayName) ? GoogleDisplayName : CustomDisplayName;
}
