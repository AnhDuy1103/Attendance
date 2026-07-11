namespace GpsAttendance.API.Enums;

/// <summary>
/// Vai trò của người dùng trong hệ thống.
/// </summary>
public static class UserRole
{
    /// <summary>Quản trị viên – có toàn quyền quản lý</summary>
    public const string Admin = "Admin";

    /// <summary>Nhân viên – chỉ được chấm công và xem lịch sử của bản thân</summary>
    public const string Employee = "Employee";
}
