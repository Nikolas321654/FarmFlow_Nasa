using System.Net.Http.Json;
using FarmFlow.Api.Features.Auth;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Database.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Respawn;
using Respawn.Graph;
using Testcontainers.PostgreSql;
using Xunit;

namespace FarmFlow.Api.Tests.Integration;

public sealed class FarmFlowWebFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("imresamu/postgis:17-3.5-alpine")
        .WithDatabase("farmflow_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private Respawner _respawner = null!;

    public async ValueTask InitializeAsync()
    {
        await _dbContainer.StartAsync();

        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        await using var connection = new NpgsqlConnection(_dbContainer.GetConnectionString());
        await connection.OpenAsync();

        _respawner = await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = ["public"],
            TablesToIgnore =
            [
                new Table("__EFMigrationsHistory"),
                new Table("spatial_ref_sys"),
                new Table("geometry_columns"),
                new Table("geography_columns"),
                new Table("raster_columns"),
                new Table("raster_overviews")
            ]
        });
    }

    public async Task ResetDatabaseAsync()
    {
        await using var connection = new NpgsqlConnection(_dbContainer.GetConnectionString());
        await connection.OpenAsync();
        await _respawner.ResetAsync(connection);
    }

    public async Task ExecuteWithDbAsync(Func<AppDbContext, Task> action)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await action(db);
    }

    public async Task<User> SeedUserAsync(
        string subject,
        string email,
        string displayName,
        string? customDisplayName = null,
        string? avatarUrl = "https://example.com/avatar.png")
    {
        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            GoogleSubjectId = subject,
            Email = email,
            GoogleDisplayName = displayName,
            CustomDisplayName = customDisplayName,
            AvatarUrl = avatarUrl,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        await ExecuteWithDbAsync(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        return user;
    }

    public async Task<HttpClient> CreateAuthenticatedClientAsync(Guid userId, bool attachCsrf = true)
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true
        });
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());

        if (attachCsrf)
        {
            var csrf = await client.GetFromJsonAsync<GetCsrfToken.Response>("/api/auth/csrf");
            client.DefaultRequestHeaders.Add(csrf!.HeaderName, csrf.Token);
        }

        return client;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:DefaultConnection", _dbContainer.GetConnectionString());
        builder.UseSetting("Database:SeedOnStartup", "false");
        builder.UseSetting("NasaSettings:ForceMock", "true");

        builder.ConfigureTestServices(services =>
        {
            services.AddAuthentication(options =>
                {
                    options.DefaultScheme = "DynamicTestOrCookie";
                    options.DefaultAuthenticateScheme = "DynamicTestOrCookie";
                    options.DefaultChallengeScheme = "DynamicTestOrCookie";
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { })
                .AddPolicyScheme("DynamicTestOrCookie", "Test or Cookie", options =>
                {
                    options.ForwardDefaultSelector = ctx =>
                        ctx.Request.Headers.ContainsKey(TestAuthHandler.UserIdHeader)
                            ? TestAuthHandler.SchemeName
                            : CookieAuthenticationDefaults.AuthenticationScheme;
                });
        });
    }

    public new async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await _dbContainer.DisposeAsync();
    }
}
