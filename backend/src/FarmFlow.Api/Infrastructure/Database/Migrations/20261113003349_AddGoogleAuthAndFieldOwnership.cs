using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FarmFlow.Api.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleAuthAndFieldOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDemo",
                table: "Fields",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "Fields",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GoogleSubjectId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    GoogleDisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CustomDisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AvatarUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Fields_IsDemo",
                table: "Fields",
                column: "IsDemo");

            migrationBuilder.CreateIndex(
                name: "IX_Fields_OwnerId",
                table: "Fields",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_GoogleSubjectId",
                table: "Users",
                column: "GoogleSubjectId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Fields_Users_OwnerId",
                table: "Fields",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Backfill IsDemo strictly for the 4 known seeded demo IDs so existing ownerless rows never leak to guests.
            migrationBuilder.Sql("""
                UPDATE "Fields"
                SET "IsDemo" = TRUE
                WHERE "OwnerId" IS NULL
                  AND "Id" IN (
                      '11111111-1111-1111-1111-111111111111',
                      '22222222-2222-2222-2222-222222222222',
                      '33333333-3333-3333-3333-333333333333',
                      '44444444-4444-4444-4444-444444444444'
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fields_Users_OwnerId",
                table: "Fields");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Fields_IsDemo",
                table: "Fields");

            migrationBuilder.DropIndex(
                name: "IX_Fields_OwnerId",
                table: "Fields");

            migrationBuilder.DropColumn(
                name: "IsDemo",
                table: "Fields");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Fields");
        }
    }
}
