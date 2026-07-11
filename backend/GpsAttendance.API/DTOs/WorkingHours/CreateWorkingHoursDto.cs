using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.WorkingHours;

/// <summary>DTO dùng khi tạo mới ca làm việc</summary>
public class CreateWorkingHoursDto
{
    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    /// <summary>Để 0 để tự động tính từ EndTime - StartTime</summary>
    [Range(0, 24.0)]
    public double ShiftDuration { get; set; } = 0;

    /// <summary>Ngưỡng tính trễ (phút). Mặc định 0 = không có ngưỡng</summary>
    [Range(0, 120)]
    public int Overtime { get; set; } = 0;
}
