using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GpsAttendance.API.Migrations;

[Migration("20261103130000_AddUsernameLogin")]
public partial class AddUsernameLogin : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "Username", table: "Users", type: "nvarchar(50)", maxLength: 50, nullable: true);
        migrationBuilder.Sql("UPDATE Users SET Username = 'nhansu1' WHERE Id = 1 AND (Username IS NULL OR Username = '')");
        migrationBuilder.CreateIndex(name: "IX_Users_Username", table: "Users", column: "Username", unique: true, filter: "[Username] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Users_Username", table: "Users");
        migrationBuilder.DropColumn(name: "Username", table: "Users");
    }
}
