using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Auth;

/// <summary>DTO nhận thông tin đăng nhập từ client</summary>
public class LoginRequestDto
{
    [Required(ErrorMessage = "Tên đăng nhập hoặc số điện thoại là bắt buộc")]
    [MaxLength(50)]
    public string Identifier { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password là bắt buộc")]
    [MinLength(6, ErrorMessage = "Password phải có ít nhất 6 ký tự")]
    public string Password { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? DeviceToken { get; set; }

    [MaxLength(100)]
    public string? DeviceName { get; set; }

    [MaxLength(50)]
    public string? DevicePlatform { get; set; }

    [MaxLength(100)]
    public string? DeviceBrowser { get; set; }

    /// <summary>Chỉ tạo yêu cầu thiết bị mới sau khi người dùng đã bấm Đồng ý.</summary>
    public bool RequestDeviceApproval { get; set; }
}
