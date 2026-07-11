namespace GpsAttendance.API.DTOs.WorkingHours;

using System.ComponentModel.DataAnnotations;

/// <summary>DTO hiển thị thông tin ca làm việc</summary>
public class WorkingHoursDto
{
    public int WorkingHourId { get; set; }
    [Required]
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public double ShiftDuration { get; set; }
    public int Overtime { get; set; } = 30;
    public bool IsActive { get; set; }
}
