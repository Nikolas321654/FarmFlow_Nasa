using System.Security.Claims;
using System.Text.Json;
using FarmFlow.Api.Infrastructure.Database;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.HttpOverrides;

namespace FarmFlow.Api.Infrastructure.Auth;

public static class AuthConfiguration
{
    public const string CsrfHeaderName = "X-CSRF-TOKEN";

    public static IServiceCollection AddFarmFlowAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));

        var googleOptions = configuration
            .GetSection(GoogleAuthOptions.SectionName)
            .Get<GoogleAuthOptions>() ?? new GoogleAuthOptions();

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });

        services.AddAntiforgery(options =>
        {
            options.HeaderName = CsrfHeaderName;
            options.Cookie.Name = "farmflow.csrf";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        });

        var authBuilder = services
            .AddAuthentication(options =>
            {
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })
            .AddCookie(options =>
            {
                options.Cookie.Name = "farmflow.session";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                options.ExpireTimeSpan = TimeSpan.FromDays(14);
                options.SlidingExpiration = true;
                options.Events = new CookieAuthenticationEvents
                {
                    OnRedirectToLogin = ctx =>
                    {
                        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    },
                    OnRedirectToAccessDenied = ctx =>
                    {
                        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return Task.CompletedTask;
                    }
                };
            });

        if (googleOptions.IsConfigured)
        {
            authBuilder.AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
            {
                options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.ClientId = googleOptions.ClientId;
                options.ClientSecret = googleOptions.ClientSecret;
                options.CallbackPath = "/api/auth/google/callback";
                options.SaveTokens = false;
                options.Scope.Clear();
                options.Scope.Add("openid");
                options.Scope.Add("profile");
                options.Scope.Add("email");
                options.Events.OnCreatingTicket = HandleGoogleCreatingTicketAsync;
            });
        }

        services.AddAuthorization();
        return services;
    }

    private static async Task HandleGoogleCreatingTicketAsync(OAuthCreatingTicketContext ctx)
    {
        var subject = TryGetJsonString(ctx.User, "sub")
            ?? ctx.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(subject))
        {
            ctx.Fail("Google account subject identifier (sub) is missing.");
            return;
        }

        var email = TryGetJsonString(ctx.User, "email")
            ?? ctx.Principal?.FindFirstValue(ClaimTypes.Email)
            ?? string.Empty;

        var displayName = TryGetJsonString(ctx.User, "name")
            ?? ctx.Principal?.FindFirstValue(ClaimTypes.Name)
            ?? email;

        var avatarUrl = TryGetJsonString(ctx.User, "picture");

        var db = ctx.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
        var user = await GoogleUserSync.UpsertBySubjectAsync(
            db,
            subject,
            email,
            displayName,
            avatarUrl,
            ctx.HttpContext.RequestAborted);

        var identity = new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("sub", user.GoogleSubjectId)
        ],
        CookieAuthenticationDefaults.AuthenticationScheme);

        ctx.Principal = new ClaimsPrincipal(identity);
    }

    private static string? TryGetJsonString(JsonElement element, string propertyName)
    {
        if (element.ValueKind == JsonValueKind.Object &&
            element.TryGetProperty(propertyName, out var prop) &&
            prop.ValueKind == JsonValueKind.String)
        {
            return prop.GetString();
        }

        return null;
    }
}

public sealed class CsrfValidationFilter(IAntiforgery antiforgery) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        try
        {
            await antiforgery.ValidateRequestAsync(context.HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Invalid or missing CSRF token.");
        }

        return await next(context);
    }
}
