using System.Security.Claims;
using FarmFlow.Api.Infrastructure.Auth;
using FarmFlow.Api.Infrastructure.Database.Entities;
using Shouldly;
using Xunit;

namespace FarmFlow.Api.Tests.Unit;

public sealed class AuthUnitTests
{
    private static readonly AuthOptions DefaultOptions = new()
    {
        FrontendDefaultRedirectUrl = "http://localhost:5173/",
        AllowedRedirectOrigins = ["http://localhost:5173", "https://farmflow.app"]
    };

    [Theory]
    [InlineData("/dashboard", "/dashboard")]
    [InlineData("/fields?tab=stress", "/fields?tab=stress")]
    [InlineData("http://localhost:5173/fields", "http://localhost:5173/fields")]
    [InlineData("https://farmflow.app/profile", "https://farmflow.app/profile")]
    [InlineData("//evil.com/phish", "http://localhost:5173/")]
    [InlineData("/\\evil.com", "http://localhost:5173/")]
    [InlineData("https://evil.com/steal", "http://localhost:5173/")]
    [InlineData("javascript:alert(1)", "http://localhost:5173/")]
    [InlineData("", "http://localhost:5173/")]
    [InlineData(null, "http://localhost:5173/")]
    public void ResolveSafeReturnUrl_AllowsSafeTargetsAndBlocksOpenRedirects(
        string? returnUrl,
        string expected)
    {
        var resolved = FieldAccessExtensions.ResolveSafeReturnUrl(returnUrl, DefaultOptions);
        resolved.ShouldBe(expected);
    }

    [Fact]
    public void GetUserIdOrNull_ReturnsGuidOnlyForAuthenticatedValidClaim()
    {
        var userId = Guid.NewGuid();
        var authed = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString())],
            "TestAuth"));
        var unauthed = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString())]));
        var invalid = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "not-a-guid")],
            "TestAuth"));

        authed.GetUserIdOrNull().ShouldBe(userId);
        unauthed.GetUserIdOrNull().ShouldBeNull();
        invalid.GetUserIdOrNull().ShouldBeNull();
    }

    [Fact]
    public void UserEffectiveDisplayName_PrefersCustomDisplayNameOverGoogleName()
    {
        var user = new User
        {
            GoogleDisplayName = "Olena Google",
            CustomDisplayName = null
        };
        user.EffectiveDisplayName.ShouldBe("Olena Google");

        user.CustomDisplayName = "Olena Cherkasy";
        user.EffectiveDisplayName.ShouldBe("Olena Cherkasy");
    }
}
