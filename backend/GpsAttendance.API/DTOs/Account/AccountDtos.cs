using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Account;

/// <summary>DTO thông tin hồ sơ tài khoản hiện tại</summary>
public class AccountProfileDto
{
    public int UserId { get; set; }
    public int? EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

/// <summary>Request cập nhật hồ sơ tài khoản (chỉ FullName và Email)</summary>
public class UpdateAccountProfileRequest
{
    [Required(ErrorMessage = "Họ tên không được để trống")]
    [MaxLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email không được để trống")]
    [MaxLength(100, ErrorMessage = "Email không được vượt quá 100 ký tự")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string Email { get; set; } = string.Empty;
}

/// <summary>Request đổi mật khẩu</summary>
public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới")]
    [MinLength(8, ErrorMessage = "Mật khẩu mới phải có ít nhất 8 ký tự")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng xác nhận mật khẩu mới")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
