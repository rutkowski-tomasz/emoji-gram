using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();

var app = builder.Build();

app.MapGet("/health", () => TypedResults.Ok());

app.MapPost("/broadcast", async (IHubContext<ShoppingHub, IShoppingClient> context) => {
    await context.Clients.All.ReceiveMessage("Hello from SignalR");
    return Results.NoContent();
});

app.MapHub<ShoppingHub>("/hub");

app.Run();

public class ShoppingHub(ILogger<ShoppingHub> logger) : Hub<IShoppingClient>
{
    public override async Task OnConnectedAsync()
    {
        logger.LogInformation("{ConntectionId} connected", Context.ConnectionId);
        // await Clients.All.SendAsync("ReceiveMessage", $"{Context.ConnectionId} connected"); 
        await Clients.All.ReceiveMessage($"{Context.ConnectionId} connected");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        logger.LogInformation("{ConntectionId} disconnected", Context.ConnectionId);
        // await Clients.All.SendAsync("ReceiveMessage", $"{Context.ConnectionId} disconnected");
        await Clients.All.ReceiveMessage($"{Context.ConnectionId} disconnected");
    }

    public async Task SendMessage(string message)
    {
        logger.LogInformation("{ConntectionId} says: {Message}", Context.ConnectionId, message);
        // await Clients.All.SendAsync("ReceiveMessage", $"{Context.ConnectionId} says: {message}");
        await Clients.All.ReceiveMessage($"{Context.ConnectionId} says: {message}");
    }
}

public interface IShoppingClient
{
    Task ReceiveMessage(string message);
}