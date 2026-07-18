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

    // Trạng thái phái sinh – xác định sau khi mapping, không lưu DB
    /// <summary>
    /// True khi nhân viên đã check-in, chưa check-out và AttendanceDate đã qua (so với giờ Việt Nam).
    /// Status gốc (Late / OnTime) vẫn được giữ nguyên.
    /// </summary>
    public bool IsForgotCheckout { get; set; }

    /// <summary>
    /// Trạng thái hiển thị ưu tiên: "ForgotCheckout" nếu IsForgotCheckout = true, ngược lại bằng Status.
    /// </summary>
    public string DisplayStatus { get; set; } = string.Empty;
}
