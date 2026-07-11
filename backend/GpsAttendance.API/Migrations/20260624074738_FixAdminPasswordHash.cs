using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GpsAttendance.API.Migrations
{
    /// <inheritdoc />
    public partial class FixAdminPasswordHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$FyJOZhFASY.t4rIa/Kc8e.XwdLlx18yHc7Ysy/TPOCP8RBKuLH5He");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$dLFbfB3SLJ3UFzJEjJuFM.FWgmvT/LwqL7M7Ot7xjGBiuFEq7Hyly");
        }
    }
}
