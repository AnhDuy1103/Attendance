namespace GpsAttendance.API.DTOs.Attendance;

/// <summary>DTO trả về thông tin bản ghi chấm công</summary>
public class AttendanceResponseDto
{
    public int AttendanceId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;

    public DateTime AttendanceDate { get; set; }

    // Check-in
    public DateTime CheckInTime { get; set; }
    public double CheckInLat { get; set; }
    public double CheckInLong { get; set; }

    // Check-out
    public DateTime? CheckOutTime { get; set; }
    public double? CheckOutLat { get; set; }
    public double? CheckOutLong { get; set; }

    // Tổng kết
    public double? ActualHours { get; set; }
    public double? OvertimeHours { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}
