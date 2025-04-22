using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SignalR.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReceiverUsername : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReceiverUsername",
                table: "Messages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceiverUsername",
                table: "Messages");
        }
    }
}
