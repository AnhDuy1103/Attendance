using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GpsAttendance.API.Models;

/// <summary>
/// Đại diện cho ca làm việc được cấu hình trong hệ thống.
/// Chứa thông tin giờ bắt đầu, kết thúc và thời lượng ca làm.
/// </summary>
public class WorkingHours
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int WorkingHourId { get; set; }


    /// <summary>Thời gian bắt đầu ca làm (giờ trong ngày)</summary>
    [Required]
    public TimeSpan StartTime { get; set; }

    /// <summary>Thời gian kết thúc ca làm (giờ trong ngày)</summary>
    [Required]
    public TimeSpan EndTime { get; set; }

    /// <summary>Thời lượng ca làm tính bằng giờ (tự động tính hoặc override)</summary>
    [Range(0.5, 24.0, ErrorMessage = "ShiftDuration phải từ 0.5 đến 24 giờ")]
    public double ShiftDuration { get; set; }

    /// <summary>Thời gian tính overtime sau bao nhiêu phút trễ (mặc định 30 phút)</summary>
    public int Overtime { get; set; } = 30;

    /// <summary>Trạng thái hoạt động của ca làm</summary>
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    /// <summary>Danh sách chấm công sử dụng ca làm này</summary>
    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
