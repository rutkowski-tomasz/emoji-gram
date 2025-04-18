using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SignalR.Api.Migrations
{
    /// <inheritdoc />
    public partial class PersistSenderUsername : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "SenderUserId",
                table: "Messages",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "SenderUsername",
                table: "Messages",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ReceiverUserId_SentAtUtc",
                table: "Messages",
                columns: new[] { "ReceiverUserId", "SentAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Messages_ReceiverUserId_SentAtUtc",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "SenderUsername",
                table: "Messages");

            migrationBuilder.AlterColumn<Guid>(
                name: "SenderUserId",
                table: "Messages",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
