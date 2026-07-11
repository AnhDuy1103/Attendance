namespace GpsAttendance.API.Enums;

/// <summary>
/// Trạng thái chấm công của nhân viên.
/// </summary>
public static class AttendanceStatus
{
    /// <summary>Đúng giờ – check-in trước hoặc đúng giờ bắt đầu ca</summary>
    public const string OnTime = "OnTime";

    /// <summary>Đi trễ – check-in sau giờ bắt đầu ca (+ ngưỡng cho phép)</summary>
    public const string Late = "Late";

    /// <summary>Sai vị trí – nhân viên nằm ngoài bán kính địa điểm</summary>
    public const string InvalidLocation = "InvalidLocation";

    /// <summary>Đã check-out – ca làm việc đã kết thúc</summary>
    public const string CheckedOut = "CheckedOut";

    /// <summary>Vắng mặt – không có bản ghi chấm công trong ngày</summary>
    public const string Absent = "Absent";
}
