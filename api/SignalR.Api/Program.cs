using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Collections.Concurrent;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
));
builder.Services.AddSignalR().AddStackExchangeRedis(builder.Configuration.GetConnectionString("Redis"));

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
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Keycloak:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Keycloak:Audience"],
            NameClaimType = "preferred_username",
            RoleClaimType = "roles"
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Host.UseSerilog((context, configuration) =>
    configuration.WriteTo.Console()
);

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => TypedResults.Ok());

app.MapPost("/broadcast", async (
    IHubContext<ShoppingHub, IShoppingClient> context,
    [FromBody] BroadcastMessage payload,
    ClaimsPrincipal user
) => {
    var email = user.FindFirstValue(ClaimTypes.Email);
    await context.Clients.All.ReceiveMessage($"{email} boradcasts: {payload.Message}");
    return Results.NoContent();
}).RequireAuthorization();

app.MapHub<ShoppingHub>("/hub").RequireAuthorization();

app.Run();

public class ShoppingHub(ILogger<ShoppingHub> logger) : Hub<IShoppingClient>
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

public interface IShoppingClient
{
    Task ReceiveMessage(string message);
    Task ReceiveWhisper(string message);
    Task WhisperError(string errorMessage);
}

public class BroadcastMessage
{
    public string Message { get; set; } = string.Empty;
}