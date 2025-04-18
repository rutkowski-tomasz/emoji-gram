using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace SignalR.Api;

public static class HistoryEndpoints
{
    public static void MapHistoryEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/history", (ApiDbContext dbContext) =>
        {
            var messages = dbContext.Messages
                .OrderByDescending(m => m.SentAtUtc)
                .Take(50)
                .ToList();

            return Results.Ok(messages);

        }).RequireAuthorization();
    }
}
