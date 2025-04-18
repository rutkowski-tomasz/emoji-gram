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
            [FromBody] BroadcastRequest request,
            ClaimsPrincipal user
        ) =>
        {
            if (!EmojiValidator.IsValidEmojiMessage(request.Message))
            {
                return Results.BadRequest("Message must contain only emojis and whitespace.");
            }

            var email = user.FindFirstValue(ClaimTypes.Email);
            await context.Clients.All.ReceiveMessage($"{email} broadcasts: {request.Message}");
            return Results.NoContent();
        }).RequireAuthorization();
    }
}

public class BroadcastRequest
{
    public string Message { get; set; } = string.Empty;
}