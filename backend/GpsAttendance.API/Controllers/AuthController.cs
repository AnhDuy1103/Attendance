using GpsAttendance.API.DTOs.Auth;
using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GpsAttendance.API.Controllers;

/// <summary>
/// AuthController – xử lý các endpoint liên quan đến xác thực người dùng.
/// Không yêu cầu [Authorize] vì đây là endpoint công khai.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Đăng nhập vào hệ thống. Trả về JWT token nếu thông tin hợp lệ.
    /// </summary>
    /// <remarks>
    /// POST /api/auth/login
    /// {
    ///   "phoneNumber": "0123456789",
    ///   "password": "Admin@123"
    /// }
    /// </remarks>
    /// <response code="200">Đăng nhập thành công, trả về JWT token</response>
    /// <response code="401">Sai username hoặc password</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponseDto<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ"));

        _logger.LogInformation("Yêu cầu đăng nhập từ định danh: {Identifier}", request.Identifier);

        var result = await _authService.LoginAsync(request);

        if (!result.IsSuccess)
        {
            _logger.LogWarning("Đăng nhập thất bại cho định danh: {Identifier}", request.Identifier);
            if (result.Code is "DEVICE_APPROVAL_CONFIRMATION_REQUIRED" or "DEVICE_APPROVAL_SENT")
                return StatusCode(StatusCodes.Status202Accepted,
                    ApiResponseDto<object>.Fail(result.Message, new List<string> { result.Code }));
            return Unauthorized(ApiResponseDto<object>.Fail(result.Message,
                result.Code == null ? null : new List<string> { result.Code }));
        }

        _logger.LogInformation("Đăng nhập thành công: {Identifier}", request.Identifier);
        return Ok(ApiResponseDto<LoginResponseDto>.Ok(result.Response!, "Đăng nhập thành công"));
    }

    /// <summary>
    /// Đăng xuất khỏi hệ thống.
    /// JWT là stateless nên logout phía client xoá token là đủ.
    /// </summary>
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status200OK)]
    public IActionResult Logout()
    {
        _logger.LogInformation("Người dùng đăng xuất: {User}", User.Identity?.Name);
        return Ok(ApiResponseDto<object>.Ok(null!, "Đăng xuất thành công. Vui lòng xoá token phía client."));
    }

    [HttpGet("debug-db")]
    public async Task<IActionResult> DebugDb([FromServices] Data.AppDbContext context)
    {
        var users = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(context.Users);
        var employees = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(context.Employees);
        return Ok(new { users, employees });
    }
}
