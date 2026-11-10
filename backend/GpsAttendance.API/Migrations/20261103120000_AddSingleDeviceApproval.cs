using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GpsAttendance.API.Migrations;

/// <summary>Thêm cơ chế mỗi tài khoản chỉ có một thiết bị đăng nhập được duyệt.</summary>
[Migration("20261103120000_AddSingleDeviceApproval")]
public partial class AddSingleDeviceApproval : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "DeviceTokenHash", table: "Users", type: "nvarchar(255)", maxLength: 255, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "DeviceName", table: "Users", type: "nvarchar(100)", maxLength: 100, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "DevicePlatform", table: "Users", type: "nvarchar(50)", maxLength: 50, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "DeviceBrowser", table: "Users", type: "nvarchar(100)", maxLength: 100, nullable: true);
        migrationBuilder.AddColumn<DateTime>(
            name: "DeviceLastLoginAt", table: "Users", type: "datetime2", nullable: true);

        migrationBuilder.CreateTable(
            name: "DeviceChangeRequests",
            columns: table => new
            {
                RequestId = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<int>(type: "int", nullable: false),
                DeviceTokenHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                DeviceName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                DevicePlatform = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                DeviceBrowser = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                IpAddress = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                ProcessedBy = table.Column<int>(type: "int", nullable: true),
                Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DeviceChangeRequests", x => x.RequestId);
                table.ForeignKey("FK_DeviceChangeRequests_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_DeviceChangeRequests_UserId_Status",
            table: "DeviceChangeRequests",
            columns: new[] { "UserId", "Status" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "DeviceChangeRequests");
        migrationBuilder.DropColumn(name: "DeviceTokenHash", table: "Users");
        migrationBuilder.DropColumn(name: "DeviceName", table: "Users");
        migrationBuilder.DropColumn(name: "DevicePlatform", table: "Users");
        migrationBuilder.DropColumn(name: "DeviceBrowser", table: "Users");
        migrationBuilder.DropColumn(name: "DeviceLastLoginAt", table: "Users");
    }
}
