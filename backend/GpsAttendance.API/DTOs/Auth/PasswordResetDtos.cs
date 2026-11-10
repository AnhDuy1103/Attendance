using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Auth;

public sealed class ForgotPasswordRequestDto
{
    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; set; } = string.Empty;
}

public sealed class VerifyOtpRequestDto
{
    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(6, MinimumLength = 6)]
    public string Otp { get; set; } = string.Empty;
}

public sealed class ResetPasswordRequestDto
{
    [Required]
    public string ResetToken { get; set; } = string.Empty;

    [Required, MinLength(6), MaxLength(100)]
    public string NewPassword { get; set; } = string.Empty;
}

public sealed record VerifyOtpResponseDto(string ResetToken);
