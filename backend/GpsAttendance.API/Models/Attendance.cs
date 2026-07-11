using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GpsAttendance.API.Models;

/// <summary>
/// Đại diện cho bản ghi chấm công của nhân viên.
/// Lưu trữ thông tin check-in, check-out cùng tọa độ GPS tương ứng.
/// </summary>
public class Attendance
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AttendanceId { get; set; }

    /// <summary>Khóa ngoại liên kết với bảng Employee</summary>
    [Required]
    public int EmployeeId { get; set; }

    /// <summary>Khóa ngoại liên kết với ca làm việc</summary>
    [Required]
    public int WorkingHourId { get; set; }

    /// <summary>Khóa ngoại liên kết với địa điểm chấm công</summary>
    [Required]
    public int LocationId { get; set; }

    // ── Thông tin Check-in ──────────────────────────────────────────────────
    
    /// <summary>Ngày chấm công</summary>
    [Required]
    [Column(TypeName = "date")]
    public DateTime AttendanceDate { get; set; }

    /// <summary>Thời điểm check-in của nhân viên</summary>
    [Required]
    public DateTime CheckInTime { get; set; }

    /// <summary>Vĩ độ GPS tại thời điểm check-in</summary>
    [Range(-90.0, 90.0)]
    public double CheckInLat { get; set; }

    /// <summary>Kinh độ GPS tại thời điểm check-in</summary>
    [Range(-180.0, 180.0)]
    public double CheckInLong { get; set; }

    // ── Thông tin Check-out ─────────────────────────────────────────────────

    /// <summary>Thời điểm check-out, null nếu chưa check-out</summary>
    public DateTime? CheckOutTime { get; set; }

    /// <summary>Vĩ độ GPS tại thời điểm check-out</summary>
    [Range(-90.0, 90.0)]
    public double? CheckOutLat { get; set; }

    /// <summary>Kinh độ GPS tại thời điểm check-out</summary>
    [Range(-180.0, 180.0)]
    public double? CheckOutLong { get; set; }

    // ── Tổng hợp giờ làm ───────────────────────────────────────────────────

    /// <summary>Tổng số giờ làm thực tế (tính khi check-out)</summary>
    public double? ActualHours { get; set; }

    /// <summary>Số giờ làm thêm ngoài ca quy định</summary>
    public double? OvertimeHours { get; set; } = 0;

    // ── Trạng thái và ghi chú ──────────────────────────────────────────────

    /// <summary>
    /// Trạng thái chấm công:
    /// Present   = Có mặt đúng giờ
    /// Late      = Đi muộn
    /// Early     = Về sớm
    /// Absent    = Vắng mặt
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Present";

    /// <summary>Ghi chú thêm cho bản ghi chấm công</summary>
    [MaxLength(500)]
    public string? Note { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(EmployeeId))]
    public virtual Employee Employee { get; set; } = null!;

    [ForeignKey(nameof(WorkingHourId))]
    public virtual WorkingHours WorkingHours { get; set; } = null!;

    [ForeignKey(nameof(LocationId))]
    public virtual Location Location { get; set; } = null!;
}
