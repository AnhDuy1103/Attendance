namespace GpsAttendance.API.DTOs.Attendance;

/// <summary>DTO báo cáo tổng hợp chấm công theo khoảng thời gian</summary>
public class AttendanceReportDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;

    /// <summary>Tổng số ngày có mặt</summary>
    public int TotalPresent { get; set; }

    /// <summary>Số ngày đi trễ</summary>
    public int TotalLate { get; set; }

    /// <summary>Số ngày vắng</summary>
    public int TotalAbsent { get; set; }

    /// <summary>Tổng giờ làm thực tế</summary>
    public double TotalActualHours { get; set; }

    /// <summary>Tổng giờ làm thêm</summary>
    public double TotalOvertimeHours { get; set; }

    /// <summary>Danh sách bản ghi chấm công trong kỳ</summary>
    public List<AttendanceResponseDto> Records { get; set; } = new();
}
