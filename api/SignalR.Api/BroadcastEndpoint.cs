using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace SignalR.Api;

public static class BroadcastEndpoints
{
    public static void MapBroadcastEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/broadcast", async (
            IHubContext<ChatHub, IChatHubClient> context,
            [FromBody] BroadcastMessage payload,
            ClaimsPrincipal user
        ) => {
            var email = user.FindFirstValue(ClaimTypes.Email);
            await context.Clients.All.ReceiveMessage($"{email} broadcasts: {payload.Message}");
            return Results.NoContent();
        }).RequireAuthorization();
    }
}

public class BroadcastMessage
{
    public string Message { get; set; } = string.Empty;
}