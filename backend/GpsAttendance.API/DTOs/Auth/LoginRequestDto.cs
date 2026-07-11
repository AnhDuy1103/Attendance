using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Auth;

/// <summary>DTO nhận thông tin đăng nhập từ client</summary>
public class LoginRequestDto
{
    [Required(ErrorMessage = "PhoneNumber là bắt buộc")]
    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password là bắt buộc")]
    [MinLength(6, ErrorMessage = "Password phải có ít nhất 6 ký tự")]
    public string Password { get; set; } = string.Empty;
}
