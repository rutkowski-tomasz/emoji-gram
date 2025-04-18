using System;
using System.Security.Claims;

namespace SignalR.Api;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }

        throw new InvalidOperationException("User ID claim not found or is not a valid GUID.");
    }

    public static string GetUsername(this ClaimsPrincipal principal)
    {
        var usernameClaim = principal.FindFirst("preferred_username");
        if (usernameClaim != null)
        {
            return usernameClaim.Value;
        }

        throw new InvalidOperationException("Username claim not found.");
    }
}