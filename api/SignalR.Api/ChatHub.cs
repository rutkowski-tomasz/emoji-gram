using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace SignalR.Api;

public class ChatHub(ILogger<ChatHub> logger) : Hub<IChatHubClient>
{
    private static readonly ConcurrentDictionary<string, HashSet<string>> UserConnections = new();

    public override async Task OnConnectedAsync()
    {
        var email = Context.User?.FindFirstValue(ClaimTypes.Email)
            ?? throw new ArgumentNullException(nameof(ClaimTypes.Email), "Email claim not found in the user context.");
        UserConnections.GetOrAdd(email, []).Add(Context.ConnectionId);
        logger.LogInformation("{Email} connected", email);
        await Clients.All.ReceiveMessage($"{email} connected");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var email = Context.User?.FindFirstValue(ClaimTypes.Email)
            ?? throw new ArgumentNullException(nameof(ClaimTypes.Email), "Email claim not found in the user context.");
        if (UserConnections.TryGetValue(email, out var connectionsIds))
        {
            connectionsIds.Remove(Context.ConnectionId);
            if (connectionsIds.Count == 0)
            {
                UserConnections.TryRemove(email, out _);
            }
        }
        logger.LogInformation("{Email} disconnected", email);
        await Clients.All.ReceiveMessage($"{email} disconnected");
    }

    public async Task SendMessage(string message)
    {
        var email = Context.User?.FindFirstValue(ClaimTypes.Email);
        logger.LogInformation("{Email} says: {Message}", email, message);
        await Clients.All.ReceiveMessage($"{email} says: {message}");
    }

    public async Task SendWhisper(string receiverEmail, string message)
    {
        var email = Context.User?.FindFirstValue(ClaimTypes.Email)
            ?? throw new ArgumentNullException(nameof(ClaimTypes.Email), "Email claim not found in the user context.");
        logger.LogInformation("{SenderEmail} whispers to {ReceiverEmail}: {Message}", email, receiverEmail, message);

        if (UserConnections.TryGetValue(receiverEmail, out var connectionsIds))
        {
            var sendTasks = connectionsIds
                .Select(connectionId => Clients.Client(connectionId).ReceiveWhisper($"{email} whispers: {message}"));

            await Task.WhenAll(sendTasks);
        }
        else
        {
            await Clients.Caller.WhisperError($"User with email '{receiverEmail}' not found.");
        }
    }
}

public interface IChatHubClient
{
    Task ReceiveMessage(string message);
    Task ReceiveWhisper(string message);
    Task WhisperError(string errorMessage);
}