using System.Text.Json.Serialization;
using FarmFlow.Api.Features.AgroAnalytics;
using FarmFlow.Api.Features.Auth;
using FarmFlow.Api.Features.Fields;
using FarmFlow.Api.Features.System;
using FarmFlow.Api.Features.Users;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database;
using FarmFlow.Api.Infrastructure.Nasa;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.IO.Converters;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Standard RFC 7807 problem details
builder.Services.AddProblemDetails();

// JSON Options with GeoJSON and string enum converters
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new GeoJsonConverterFactory());
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Database (PostgreSQL + PostGIS)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.UseNetTopologySuite()));

// Caching & HttpClient
builder.Services.AddMemoryCache();
builder.Services.AddHybridCache();
builder.Services.Configure<NasaSettings>(builder.Configuration.GetSection(NasaSettings.SectionName));
builder.Services.AddHttpClient<NasaPowerClient>();

// Authentication, Cookies, Google OAuth & CSRF
builder.Services.AddFarmFlowAuth(builder.Configuration);

// OpenAPI & Documentation
builder.Services.AddOpenApi();

// CORS for Frontend integration (explicit origins required when AllowCredentials is enabled)
var allowedOrigins = (builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:3000"])
    .Where(origin => !string.IsNullOrWhiteSpace(origin) && origin != "*")
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// NASA Satellite & Fixture Services
builder.Services.AddSingleton<INasaFixtureStore, FileNasaFixtureStore>();
builder.Services.AddSingleton<MockNasaClient>();
builder.Services.AddScoped<INasaClient, ResilientNasaClient>();

var app = builder.Build();

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("FarmFlow NASA API")
               .WithTheme(ScalarTheme.Moon);
    });
}

await app.InitializeDatabaseAsync();

// Feature Endpoints
app.MapSystemEndpoints();
app.MapAuthEndpoints();
app.MapUsersEndpoints();
app.MapFieldsEndpoints();
app.MapAgroAnalyticsEndpoints();

await app.RunAsync();

public partial class Program
{
    protected Program() { }
}
