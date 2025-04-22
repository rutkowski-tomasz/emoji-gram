using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using Serilog;
using System.Threading.Tasks;

namespace SignalR.Api;

public static class BroadcastEndpoints
{
    public static void MapBroadcastEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/broadcast", async (
            IHubContext<ChatHub, IChatHubClient> context,
            [FromBody] BroadcastRequest request,
            ClaimsPrincipal user,
            ApiDbContext dbContext
        ) =>
        {
            if (!EmojiValidator.IsValidEmojiMessage(request.Message))
            {
                return Results.BadRequest("Message must contain only emojis and whitespace.");
            }

            var userId = user.GetUserId();
            var username = user.GetUsername();

            var message = new Message
            {
                Id = Guid.NewGuid(),
                SenderUserId = userId,
                SenderUsername = username,
                Content = request.Message,
                SentAtUtc = DateTime.UtcNow
            };
            dbContext.Messages.Add(message);
            await dbContext.SaveChangesAsync();

            await context.Clients.All.ReceiveMessage(message);

            return Results.NoContent();
        }).RequireAuthorization();
    }
}

public class BroadcastRequest
{
    public string Message { get; set; } = string.Empty;
}