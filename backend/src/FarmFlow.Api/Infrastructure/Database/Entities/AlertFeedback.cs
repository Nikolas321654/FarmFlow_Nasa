namespace FarmFlow.Api.Infrastructure.Database.Entities;

public class AlertFeedback
{
    public Guid Id { get; set; }
    public Guid FieldId { get; set; }
    public Field Field { get; set; } = null!;
    public string AlertType { get; set; } = string.Empty;
    public bool IsAccurate { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
