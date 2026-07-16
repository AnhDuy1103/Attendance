using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using GpsAttendance.API.DTOs.Account;
using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.Repositories.Interfaces;
using GpsAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GpsAttendance.API.Controllers;

/// <summary>
/// AccountController – quản lý tài khoản của người dùng đang đăng nhập.
/// Tất cả endpoint yêu cầu xác thực JWT.
/// </summary>
[ApiController]
[Route("api/account")]
[Authorize]
[Produces("application/json")]
public class AccountController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        IUserRepository userRepository,
        IEmployeeRepository employeeRepository,
        ILogger<AccountController> logger)
    {
        _userRepository = userRepository;
        _employeeRepository = employeeRepository;
        _logger = logger;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helper: lấy userId từ JWT Claims
    // ──────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Lấy UserId từ JWT Claims. Thử các claim: "userId", "sub", ClaimTypes.NameIdentifier.
    /// </summary>
    private int? GetCurrentUserId()
    {
        var raw =
            User.FindFirst("userId")?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (int.TryParse(raw, out var userId) && userId > 0)
            return userId;

        return null;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/account/me
    // ──────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Lấy thông tin hồ sơ tài khoản đang đăng nhập.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponseDto<AccountProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponseDto<object>.Fail("Không xác định được tài khoản đang đăng nhập"));

        var user = await _userRepository.GetByIdWithEmployeeAsync(userId.Value);
        if (user == null || !user.IsActive)
            return NotFound(ApiResponseDto<object>.Fail("Tài khoản không tồn tại hoặc đã bị vô hiệu hoá"));

        var employee = user.Employee;

        var dto = new AccountProfileDto
        {
            UserId = user.Id,
            EmployeeId = employee?.EmployeeId,
            FullName = employee?.FullName ?? "Quản trị viên",
            Email = employee?.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
        };

        _logger.LogInformation("Lấy hồ sơ thành công cho userId: {UserId}", userId);
        return Ok(ApiResponseDto<AccountProfileDto>.Ok(dto, "Lấy thông tin hồ sơ thành công"));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT /api/account/me
    // ──────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Cập nhật hồ sơ tài khoản (chỉ FullName và Email).
    /// PhoneNumber và Role không được phép thay đổi qua endpoint này.
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(ApiResponseDto<AccountProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateAccountProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ", errors));
        }

        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponseDto<object>.Fail("Không xác định được tài khoản đang đăng nhập"));

        var user = await _userRepository.GetByIdWithEmployeeAsync(userId.Value);
        if (user == null || !user.IsActive)
            return NotFound(ApiResponseDto<object>.Fail("Tài khoản không tồn tại hoặc đã bị vô hiệu hoá"));

        var employee = user.Employee;
        if (employee == null)
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy hồ sơ nhân viên liên kết với tài khoản"));

        // Chỉ cập nhật FullName và Email – không cho phép đổi PhoneNumber hay Role
        employee.FullName = request.FullName.Trim();
        employee.Email = request.Email.Trim();

        _employeeRepository.Update(employee);
        await _employeeRepository.SaveChangesAsync();

        var dto = new AccountProfileDto
        {
            UserId = user.Id,
            EmployeeId = employee.EmployeeId,
            FullName = employee.FullName,
            Email = employee.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
        };

        _logger.LogInformation("Cập nhật hồ sơ thành công cho userId: {UserId}", userId);
        return Ok(ApiResponseDto<AccountProfileDto>.Ok(dto, "Cập nhật hồ sơ thành công"));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT /api/account/change-password
    // ──────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Đổi mật khẩu của tài khoản đang đăng nhập.
    /// Xác minh mật khẩu cũ trước khi cho phép đổi.
    /// </summary>
    [HttpPut("change-password")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ", errors));
        }

        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponseDto<object>.Fail("Không xác định được tài khoản đang đăng nhập"));

        var user = await _userRepository.GetByIdAsync(userId.Value);
        if (user == null || !user.IsActive)
            return Unauthorized(ApiResponseDto<object>.Fail("Tài khoản không tồn tại hoặc đã bị vô hiệu hoá"));

        // Xác minh mật khẩu hiện tại bằng BCrypt
        if (!AuthService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            return BadRequest(ApiResponseDto<object>.Fail("Mật khẩu hiện tại không đúng"));

        // Kiểm tra mật khẩu mới phải có ít nhất 1 chữ cái
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.NewPassword, @"[A-Za-z]"))
            return BadRequest(ApiResponseDto<object>.Fail("Mật khẩu mới phải có ít nhất một chữ cái"));

        // Kiểm tra mật khẩu mới phải có ít nhất 1 chữ số
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.NewPassword, @"\d"))
            return BadRequest(ApiResponseDto<object>.Fail("Mật khẩu mới phải có ít nhất một chữ số"));

        // Mật khẩu mới không được trùng mật khẩu hiện tại
        if (AuthService.VerifyPassword(request.NewPassword, user.PasswordHash))
            return BadRequest(ApiResponseDto<object>.Fail("Mật khẩu mới phải khác mật khẩu hiện tại"));

        // Xác nhận mật khẩu phải khớp
        if (request.ConfirmPassword != request.NewPassword)
            return BadRequest(ApiResponseDto<object>.Fail("Xác nhận mật khẩu không khớp"));

        // Hash và lưu mật khẩu mới bằng BCrypt
        user.PasswordHash = AuthService.HashPassword(request.NewPassword);
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation("Đổi mật khẩu thành công cho userId: {UserId}", userId);
        return Ok(ApiResponseDto<object>.Ok(
            new { message = "Đổi mật khẩu thành công" },
            "Đổi mật khẩu thành công"));
    }
}
