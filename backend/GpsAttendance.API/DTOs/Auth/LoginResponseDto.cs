namespace GpsAttendance.API.DTOs.Auth;

/// <summary>DTO trả về sau khi đăng nhập thành công</summary>
public class LoginResponseDto
{
    /// <summary>JWT Access Token dùng để xác thực các request tiếp theo</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>Thời điểm token hết hạn (UTC)</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>Thông tin cơ bản của người dùng đang đăng nhập</summary>
    public UserInfoDto UserInfo { get; set; } = new();
}

/// <summary>DTO thông tin user trả về trong payload JWT response</summary>
public class UserInfoDto
{
    public int UserId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? EmployeeId { get; set; }
    public string? EmployeeCode { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
}
