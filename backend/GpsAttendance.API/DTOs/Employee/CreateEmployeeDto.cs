using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Employee;

/// <summary>DTO dùng khi tạo mới nhân viên (kèm thông tin tài khoản)</summary>
public class CreateEmployeeDto
{
    [Required(ErrorMessage = "FullName là bắt buộc")]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;


    [MaxLength(100)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Position { get; set; } = string.Empty;

    [Required]
    [Phone]
    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public DateTime? JoinDate { get; set; }
}
