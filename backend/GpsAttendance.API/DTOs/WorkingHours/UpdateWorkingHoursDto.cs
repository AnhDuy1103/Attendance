using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.WorkingHours;

/// <summary>DTO dùng khi cập nhật ca làm việc</summary>
public class UpdateWorkingHoursDto
{
    public TimeSpan? StartTime { get; set; }

    public TimeSpan? EndTime { get; set; }

    [Range(0, 24.0)]
    public double? ShiftDuration { get; set; }

    [Range(0, 120)]
    public int? Overtime { get; set; }

    public bool? IsActive { get; set; }
}
