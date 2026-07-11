using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GpsAttendance.API.Models;

/// <summary>
/// Đại diện cho tài khoản đăng nhập của người dùng trong hệ thống.
/// Mỗi User có thể là Admin hoặc Employee.
/// </summary>
public class User
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>Số điện thoại đăng nhập, duy nhất trong hệ thống</summary>
    [Required(ErrorMessage = "PhoneNumber là bắt buộc")]
    [MaxLength(20, ErrorMessage = "PhoneNumber không được vượt quá 20 ký tự")]
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>Mật khẩu đã được hash bằng BCrypt</summary>
    [Required(ErrorMessage = "PasswordHash là bắt buộc")]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Vai trò: Admin hoặc Employee</summary>
    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "Employee";

    /// <summary>Thời điểm tạo tài khoản</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Trạng thái hoạt động của tài khoản</summary>
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    /// <summary>Thông tin nhân viên liên kết với tài khoản này</summary>
    public virtual Employee? Employee { get; set; }
}
