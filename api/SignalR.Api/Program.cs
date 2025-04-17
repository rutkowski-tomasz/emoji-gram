using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
));
builder.Services.AddSignalR();

builder.Services.AddAuthorization();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Keycloak:Authority"];
        options.Audience = builder.Configuration["Keycloak:Audience"];
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = "preferred_username",
            RoleClaimType = "roles"
        };
    });

var app = builder.Build();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => TypedResults.Ok());

app.MapPost("/broadcast", async (IHubContext<ShoppingHub, IShoppingClient> context) => {
    await context.Clients.All.ReceiveMessage("Hello from SignalR");
    return Results.NoContent();
}).RequireAuthorization();

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