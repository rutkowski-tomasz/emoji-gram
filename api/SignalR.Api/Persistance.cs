using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.ComponentModel.DataAnnotations;

namespace SignalR.Api;

public class Message
{
    [Key]
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid SenderUserId { get; set; }
    public string SenderUsername { get; set; }
    public Guid? ReceiverUserId { get; set; }
    public string? ReceiverUsername { get; set; }
    public DateTime SentAtUtc { get; set; }
    public MessageType Type { get; set; }
}

public enum MessageType
{
    Connected,
    Disconnected,
    Message,
    Whisper,
}

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasIndex(m => m.SentAtUtc);
        builder.HasIndex(m => new { m.ReceiverUserId, m.SentAtUtc });
    }
}

public class ApiDbContext(DbContextOptions<ApiDbContext> options) : DbContext(options)
{
    public DbSet<Message> Messages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new MessageConfiguration());
    }
}

public static class EntityFrameworkExtensions
{
    public static IServiceCollection AddDbContext(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<ApiDbContext>(options => options.UseNpgsql(connectionString));
        return services;
    }
}