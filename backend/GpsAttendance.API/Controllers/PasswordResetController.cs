using System.Security.Cryptography;
using GpsAttendance.API.Data;
using GpsAttendance.API.DTOs.Auth;
using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace GpsAttendance.API.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public sealed class PasswordResetController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly IMemoryCache _cache;

    public PasswordResetController(AppDbContext db, IEmailSender emailSender, IMemoryCache cache)
    {
        _db = db; _emailSender = emailSender; _cache = cache;
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequestDto request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.IsActive && u.Employee != null && u.Employee.Email != null && u.Employee.Email.ToLower() == email, cancellationToken);

        if (user == null)
            return NotFound(ApiResponseDto<object>.Fail("Email chưa được liên kết với tài khoản."));

        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        _cache.Set($"password-otp:{email}", new OtpEntry(user.Id, BCrypt.Net.BCrypt.HashPassword(otp)), TimeSpan.FromMinutes(5));
        await _emailSender.SendOtpAsync(email, otp, cancellationToken);
        return Ok(ApiResponseDto<object>.Ok(null!, "Mã OTP đã được gửi đến email của bạn."));
    }

    [HttpPost("verify-otp")]
    public IActionResult VerifyOtp(VerifyOtpRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (!_cache.TryGetValue<OtpEntry>($"password-otp:{email}", out var entry) || entry == null || !BCrypt.Net.BCrypt.Verify(request.Otp.Trim(), entry.OtpHash))
            return BadRequest(ApiResponseDto<object>.Fail("Mã OTP không đúng hoặc đã hết hạn."));

        var resetToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        _cache.Set($"password-reset:{resetToken}", entry.UserId, TimeSpan.FromMinutes(10));
        _cache.Remove($"password-otp:{email}");
        return Ok(ApiResponseDto<VerifyOtpResponseDto>.Ok(new VerifyOtpResponseDto(resetToken), "Xác thực OTP thành công."));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequestDto request, CancellationToken cancellationToken)
    {
        if (!_cache.TryGetValue<int>($"password-reset:{request.ResetToken}", out var userId))
            return BadRequest(ApiResponseDto<object>.Fail("Phiên đặt lại mật khẩu đã hết hạn."));

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken);
        if (user == null) return BadRequest(ApiResponseDto<object>.Fail("Tài khoản không tồn tại."));
        user.PasswordHash = AuthService.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync(cancellationToken);
        _cache.Remove($"password-reset:{request.ResetToken}");
        return Ok(ApiResponseDto<object>.Ok(null!, "Đặt lại mật khẩu thành công."));
    }

    private sealed record OtpEntry(int UserId, string OtpHash);
}
