namespace GpsAttendance.API.DTOs.Attendance;

/// <summary>DTO trả về trạng thái chấm công hôm nay của nhân viên</summary>
public class TodayAttendanceDto
{
    public bool HasCheckedIn { get; set; }
    public bool HasCheckedOut { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public double? ActualHours { get; set; }
    public double? OvertimeHours { get; set; }
    public string Status { get; set; } = "NotCheckedIn";
    public string? LocationName { get; set; }
    public string? Note { get; set; }
    public int? AttendanceId { get; set; }
}
