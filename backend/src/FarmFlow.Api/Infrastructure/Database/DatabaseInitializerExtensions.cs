using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Infrastructure.Database;

public static class DatabaseInitializerExtensions
{
    public static async Task InitializeDatabaseAsync(this WebApplication app, CancellationToken ct = default)
    {
        if (!app.Configuration.GetValue("Database:SeedOnStartup", true))
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync(ct);
        await DbSeeder.SeedAsync(db, ct);
    }
}
