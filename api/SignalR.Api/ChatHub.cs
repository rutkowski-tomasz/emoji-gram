using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace SignalR.Api;

[Authorize]
public class ChatHub(ILogger<ChatHub> logger, ApiDbContext dbContext) : Hub<IChatHubClient>
{
    public override async Task OnConnectedAsync()
    {
        var senderUserId = Context.User!.GetUserId();
        var senderUsername = Context.User!.GetUsername();

        logger.LogInformation("{SenderUsername} ({UserId}) connected", senderUsername, senderUserId);

        var joinMessage = new Message
        {
            Id = Guid.NewGuid(),
            Content = string.Empty,
            SentAtUtc = DateTime.UtcNow,
            SenderUserId = senderUserId,
            SenderUsername = senderUsername,
            Type = MessageType.Connected
        };
        dbContext.Messages.Add(joinMessage);

        await Task.WhenAll(
            dbContext.SaveChangesAsync(),
            Clients.All.ReceiveMessage(joinMessage)
        );
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var senderUserId = Context.User!.GetUserId();
        var senderUsername = Context.User!.GetUsername();

        logger.LogInformation("{SenderUsername} ({SenderUserId}) disconnected", senderUsername, senderUserId);

        var disconnectMessage = new Message
        {
            Id = Guid.NewGuid(),
            Content = string.Empty,
            SentAtUtc = DateTime.UtcNow,
            SenderUsername = senderUsername,
            Type = MessageType.Disconnected
        };
        dbContext.Messages.Add(disconnectMessage);

        await Task.WhenAll(
            dbContext.SaveChangesAsync(),
            Clients.All.ReceiveMessage(disconnectMessage)
        );
    }

    public async Task SendMessage(string message)
    {
        if (!EmojiValidator.IsValidEmojiMessage(message))
        {
            await Clients.Caller.ReceiveError("Server: Message must contain only emojis and whitespace.");
            return;
        }
        var senderUserId = Context.User!.GetUserId();
        var senderUsername = Context.User!.GetUsername();
        logger.LogInformation("{SenderUsername} sent {Message}", senderUsername, message);

        var newMessage = new Message
        {
            Id = Guid.NewGuid(),
            SenderUserId = senderUserId,
            SenderUsername = senderUsername,
            Content = message,
            SentAtUtc = DateTime.UtcNow,
            Type = MessageType.Message
        };
        dbContext.Messages.Add(newMessage);

        await Task.WhenAll(
            dbContext.SaveChangesAsync(),
            Clients.All.ReceiveMessage(newMessage)
        );
    }

    public async Task SendWhisper(Guid receiverUserId, string receiverUsername, string message)
    {
        if (!EmojiValidator.IsValidEmojiMessage(message))
        {
            await Clients.Caller.ReceiveError("Server: Whisper must contain only emojis and whitespace.");
            return;
        }
        var senderUserId = Context.User!.GetUserId();
        var senderUsername = Context.User!.GetUsername();

        logger.LogInformation("{SenderUsername} ({SenderUserId}) whispers to {ReceiverUsername} ({ReceiverUserId}): {Message}", senderUsername, senderUserId, receiverUsername, receiverUserId, message);

        var whisperMessage = new Message
        {
            Id = Guid.NewGuid(),
            SenderUserId = senderUserId,
            SenderUsername = senderUsername,
            ReceiverUserId = receiverUserId,
            ReceiverUsername = receiverUsername,
            Content = message,
            SentAtUtc = DateTime.UtcNow,
            Type = MessageType.Whisper
        };
        dbContext.Messages.Add(whisperMessage);

        await Task.WhenAll(
            dbContext.SaveChangesAsync(),
            Clients.User(receiverUserId.ToString()).ReceiveMessage(whisperMessage),
            Clients.Caller.ReceiveMessage(whisperMessage)
        );
    }
}

public interface IChatHubClient
{
    Task ReceiveMessage(Message message);
    Task ReceiveError(string errorMessage);
}
