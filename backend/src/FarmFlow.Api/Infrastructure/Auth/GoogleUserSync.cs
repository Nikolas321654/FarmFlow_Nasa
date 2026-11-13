using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Infrastructure.Auth;

public static class GoogleUserSync
{
    public static async Task<User> UpsertBySubjectAsync(
        AppDbContext db,
        string subject,
        string email,
        string displayName,
        string? avatarUrl,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(subject);

        var now = DateTimeOffset.UtcNow;
        var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleSubjectId == subject, ct);

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                GoogleSubjectId = subject,
                Email = email,
                GoogleDisplayName = string.IsNullOrWhiteSpace(displayName) ? email : displayName,
                CustomDisplayName = null,
                AvatarUrl = avatarUrl,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };
            db.Users.Add(user);
        }
        else
        {
            // Keep CustomDisplayName untouched so user-edited profile names survive repeat logins.
            user.Email = email;
            user.GoogleDisplayName = string.IsNullOrWhiteSpace(displayName) ? email : displayName;
            user.AvatarUrl = avatarUrl;
            user.UpdatedAtUtc = now;
        }

        await db.SaveChangesAsync(ct);
        return user;
    }
}
