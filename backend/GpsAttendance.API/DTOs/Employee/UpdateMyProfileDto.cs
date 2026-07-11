using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Employee;

/// <summary>DTO dùng khi nhân viên cập nhật thông tin cá nhân</summary>
public class UpdateMyProfileDto
{
    [Required(ErrorMessage = "Vui lòng nhập họ tên")]
    [MaxLength(100)]
    public string FullName { get; set; } = null!;

    [Required(ErrorMessage = "Vui lòng nhập email")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    [MaxLength(100)]
    public string Email { get; set; } = null!;
}
