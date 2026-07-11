using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GpsAttendance.API.Models;

/// <summary>
/// Đại diện cho thông tin nhân viên trong công ty.
/// Liên kết 1-1 với User thông qua UserId.
/// </summary>
public class Employee
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int EmployeeId { get; set; }

    /// <summary>Khóa ngoại liên kết với bảng User</summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>Mã nhân viên (tự sinh, dạng QH01)</summary>
    [Required]
    [MaxLength(50)]
    public string EmployeeCode { get; set; } = string.Empty;

    /// <summary>Họ và tên đầy đủ của nhân viên</summary>
    [Required(ErrorMessage = "FullName là bắt buộc")]
    [MaxLength(100, ErrorMessage = "FullName không được vượt quá 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>Địa chỉ email</summary>
    [MaxLength(100)]
    public string? Email { get; set; }

    /// <summary>Phòng ban mà nhân viên làm việc</summary>
    [MaxLength(100)]
    public string Department { get; set; } = string.Empty;

    /// <summary>Chức vụ/Vị trí công việc</summary>
    [MaxLength(100)]
    public string Position { get; set; } = string.Empty;

    /// <summary>Trạng thái nhân viên (Active, Inactive, Suspended)</summary>
    [MaxLength(50)]
    public string EmployeeStatus { get; set; } = "Active";

    /// <summary>Ngày vào làm</summary>
    public DateTime? JoinDate { get; set; }

    // Navigation Properties
    /// <summary>Tài khoản User liên kết</summary>
    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    /// <summary>Danh sách bản ghi chấm công của nhân viên</summary>
    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
