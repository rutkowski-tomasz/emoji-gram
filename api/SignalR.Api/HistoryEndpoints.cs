using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace SignalR.Api;

public static class HistoryEndpoints
{
    public static void MapHistoryEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/history", (
            ApiDbContext dbContext,
            ClaimsPrincipal user
        ) =>
        {
            var messages = dbContext.Messages
                .Where(m => m.ReceiverUserId == null || m.ReceiverUserId == user.GetUserId())
                .OrderByDescending(m => m.SentAtUtc)
                .Take(50)
                .ToList();

            return Results.Ok(messages);

        }).RequireAuthorization();
    }
}
