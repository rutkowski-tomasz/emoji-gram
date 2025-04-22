using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace SignalR.Api;

public class ChatHub(ILogger<ChatHub> logger, ApiDbContext dbContext) : Hub<IChatHubClient>
{
    private static readonly ConcurrentDictionary<Guid, HashSet<string>> UserConnections = new();
    private static readonly ConcurrentDictionary<string, Guid> UsernameToId = new();

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User!.GetUserId();
        var preferredUsername = Context.User!.GetUsername();

        UserConnections.GetOrAdd(userId, []).Add(Context.ConnectionId);
        UsernameToId.TryAdd(preferredUsername, userId);
        logger.LogInformation("{PreferredUsername} ({UserId}) connected", preferredUsername, userId);

        var joinMessage = new Message
        {
            Id = Guid.NewGuid(),
            Content = $"{preferredUsername} connected",
            SentAtUtc = DateTime.UtcNow,
            Type = MessageType.Connected
        };
        dbContext.Messages.Add(joinMessage);
        await dbContext.SaveChangesAsync();

        await Clients.All.ReceiveMessage(joinMessage);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User!.GetUserId();
        var preferredUsername = Context.User!.GetUsername();

        if (UserConnections.TryGetValue(userId, out var connectionsIds))
        {
            connectionsIds.Remove(Context.ConnectionId);
            if (connectionsIds.Count == 0)
            {
                UserConnections.TryRemove(userId, out _);
            }
        }
        UsernameToId.TryRemove(preferredUsername, out _);
        logger.LogInformation("{PreferredUsername} ({UserId}) disconnected", preferredUsername, userId);

        var disconnectMessage = new Message
        {
            Id = Guid.NewGuid(),
            Content = $"{preferredUsername} disconnected",
            SentAtUtc = DateTime.UtcNow,
            Type = MessageType.Disconnected
        };
        dbContext.Messages.Add(disconnectMessage);
        await dbContext.SaveChangesAsync();

        await Clients.All.ReceiveMessage(disconnectMessage);
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
        await dbContext.SaveChangesAsync();

        await Clients.All.ReceiveMessage(newMessage);
    }

    public async Task SendWhisper(string receiverUsername, string message)
    {
        if (!EmojiValidator.IsValidEmojiMessage(message))
        {
            await Clients.Caller.ReceiveError("Server: Whisper must contain only emojis and whitespace.");
            return;
        }
        var senderUserId = Context.User!.GetUserId();
        var senderUsername = Context.User!.GetUsername();

        if (UsernameToId.TryGetValue(receiverUsername, out var receiverUserId))
        {
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
            await dbContext.SaveChangesAsync();

            if (UserConnections.TryGetValue(receiverUserId, out var connectionsIds))
            {
                var sendTasks = connectionsIds
                    .Select(connectionId => Clients.Client(connectionId).ReceiveMessage(whisperMessage));

                await Task.WhenAll(sendTasks);
            }

            await Clients.Caller.ReceiveMessage(whisperMessage);
        }
        else
        {
            await Clients.Caller.ReceiveError($"User with username '{receiverUsername}' not found.");
        }
    }
}

public interface IChatHubClient
{
    Task ReceiveMessage(Message message);
    Task ReceiveError(string errorMessage);
}
