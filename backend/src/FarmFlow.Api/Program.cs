using System.Text.Json.Serialization;
using FarmFlow.Api.Features.System;
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
builder.Services.AddHttpClient();

// OpenAPI & Documentation
builder.Services.AddOpenApi();

// CORS for local Frontend integration
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// NASA Satellite & Fixture Services
builder.Services.AddSingleton<INasaFixtureStore, FileNasaFixtureStore>();
builder.Services.AddSingleton<INasaClient, MockNasaClient>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("FarmFlow NASA API")
               .WithTheme(ScalarTheme.Moon);
    });
}

// Feature Endpoints
app.MapSystemEndpoints();

await app.RunAsync();
