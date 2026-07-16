using System.Security.Claims;
using GpsAttendance.API.DTOs.Attendance;
using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.Services;
using GpsAttendance.API.Services.Interfaces;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GpsAttendance.API.Controllers;

/// <summary>
/// AttendanceController – xử lý các endpoint chấm công GPS.
/// Tất cả endpoint yêu cầu xác thực JWT.
/// </summary>
[ApiController]
[Route("api/attendance")]
[Authorize]
[Produces("application/json")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ILogger<AttendanceController> _logger;

    public AttendanceController(
        IAttendanceService attendanceService,
        IEmployeeRepository employeeRepository,
        ILogger<AttendanceController> logger)
    {
        _attendanceService = attendanceService;
        _employeeRepository = employeeRepository;
        _logger = logger;
    }

    // ═══════════════════════════════════════════════════════════════════
    // EMPLOYEE ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════

    /// <summary>
    /// [Employee] Lấy trạng thái chấm công hôm nay.
    /// </summary>
    [HttpGet("today")]
    [Authorize(Roles = "Employee,Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<TodayAttendanceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetToday()
    {
        var employeeId = await GetEmployeeIdFromTokenAsync();
        if (employeeId == null)
            return Unauthorized(ApiResponseDto<object>.Fail("Không xác định được thông tin nhân viên từ token"));

        var dto = await _attendanceService.GetTodayStatusAsync(employeeId.Value);
        return Ok(ApiResponseDto<TodayAttendanceDto>.Ok(dto, "Trạng thái chấm công hôm nay"));
    }

    /// <summary>
    /// [Employee] Nhân viên thực hiện Check-in bằng GPS.
    /// Chỉ cần gửi latitude và longitude, backend tự xác định Location và WorkingHours.
    /// </summary>
    /// <remarks>
    /// POST /api/attendance/check-in
    /// {
    ///   "latitude": 15.879440,
    ///   "longitude": 108.335000
    /// }
    /// </remarks>
    [HttpPost("check-in")]
    [Authorize(Roles = "Employee,Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<AttendanceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ"));

        var employeeId = await GetEmployeeIdFromTokenAsync();
        if (employeeId == null)
            return Unauthorized(ApiResponseDto<object>.Fail("Không xác định được thông tin nhân viên từ token"));

        _logger.LogInformation("Check-in request từ EmployeeId: {EmployeeId}", employeeId);

        var (success, message, data) = await _attendanceService.CheckInAsync(employeeId.Value, request);

        if (!success)
        {
            _logger.LogWarning("Check-in thất bại: {Message}", message);
            return BadRequest(ApiResponseDto<AttendanceResponseDto>.Fail(message));
        }

        return Ok(ApiResponseDto<AttendanceResponseDto>.Ok(data!, message));
    }

    /// <summary>
    /// [Employee] Nhân viên thực hiện Check-out kết thúc ca làm.
    /// Hệ thống tính giờ làm thực tế và overtime.
    /// </summary>
    [HttpPost("check-out")]
    [Authorize(Roles = "Employee,Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<AttendanceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ"));

        var employeeId = await GetEmployeeIdFromTokenAsync();
        if (employeeId == null)
            return Unauthorized(ApiResponseDto<object>.Fail("Không xác định được thông tin nhân viên từ token"));

        _logger.LogInformation("Check-out request từ EmployeeId: {EmployeeId}", employeeId);

        var (success, message, data) = await _attendanceService.CheckOutAsync(employeeId.Value, request);

        if (!success)
        {
            _logger.LogWarning("Check-out thất bại: {Message}", message);
            return BadRequest(ApiResponseDto<AttendanceResponseDto>.Fail(message));
        }

        return Ok(ApiResponseDto<AttendanceResponseDto>.Ok(data!, message));
    }

    /// <summary>
    /// [Employee] Lấy lịch sử chấm công của nhân viên đang đăng nhập.
    /// Mặc định 30 ngày gần nhất.
    /// </summary>
    [HttpGet("my-history")]
    [Authorize(Roles = "Employee,Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<AttendanceResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyHistory(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var employeeId = await GetEmployeeIdFromTokenAsync();
        if (employeeId == null)
            return Unauthorized(ApiResponseDto<object>.Fail("Không xác định được thông tin nhân viên từ token"));

        var history = await _attendanceService.GetMyHistoryAsync(employeeId.Value, fromDate, toDate);
        var list = history.ToList();

        return Ok(ApiResponseDto<IEnumerable<AttendanceResponseDto>>.Ok(list,
            $"Tìm thấy {list.Count} bản ghi chấm công"));
    }

    // ═══════════════════════════════════════════════════════════════════
    // ADMIN ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════

    /// <summary>
    /// [Admin] Lấy tất cả bản ghi chấm công. Mặc định 30 ngày gần nhất.
    /// </summary>
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<AttendanceResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var attendances = await _attendanceService.GetAllAsync(fromDate, toDate);
        var list = attendances.ToList();

        return Ok(ApiResponseDto<IEnumerable<AttendanceResponseDto>>.Ok(list,
            $"Tìm thấy {list.Count} lượt chấm công"));
    }

    /// <summary>
    /// [Admin] Lấy lịch sử chấm công của một nhân viên theo ID.
    /// </summary>
    [HttpGet("employee/{employeeId:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<AttendanceResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByEmployee(
        int employeeId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var records = await _attendanceService.GetByEmployeeAsync(employeeId, fromDate, toDate);
        var list = records.ToList();

        return Ok(ApiResponseDto<IEnumerable<AttendanceResponseDto>>.Ok(list,
            $"Tìm thấy {list.Count} bản ghi của nhân viên ID: {employeeId}"));
    }

    /// <summary>
    /// [Admin] Báo cáo tổng hợp chấm công theo tháng của một nhân viên.
    /// </summary>
    [HttpGet("report")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<AttendanceReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReport(
        [FromQuery] int employeeId = 0,
        [FromQuery] int year = 0,
        [FromQuery] int month = 0)
    {
        if (employeeId <= 0)
            return BadRequest(ApiResponseDto<object>.Fail("employeeId là bắt buộc"));

        year = year <= 0 ? DateTime.Now.Year : year;
        month = month <= 0 ? DateTime.Now.Month : month;

        var report = await _attendanceService.GetMonthlyReportAsync(employeeId, year, month);
        if (report == null)
            return NotFound(ApiResponseDto<object>.Fail($"Không tìm thấy nhân viên ID: {employeeId}"));

        return Ok(ApiResponseDto<AttendanceReportDto>.Ok(report,
            $"Báo cáo tháng {month}/{year} của {report.EmployeeName}"));
    }

    // ── Helper Methods ────────────────────────────────────────────────────────

    /// <summary>
    /// Lấy EmployeeId từ JWT Claims.
    /// Nếu claim "employeeId" rỗng (ví dụ admin), tìm Employee theo userId.
    /// </summary>
    private async Task<int?> GetEmployeeIdFromTokenAsync()
    {
        // Try from claim first
        var claim = User.FindFirst("employeeId")?.Value;
        if (int.TryParse(claim, out var id) && id > 0)
            return id;

        // Fallback: look up Employee by userId
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            var employee = await _employeeRepository.GetByUserIdAsync(userId);
            return employee?.EmployeeId;
        }

        return null;
    }

    /// <summary>Lấy UserId của Admin đang đăng nhập từ JWT Claims.</summary>
    private int GetCurrentUserId()
    {
        var raw = User.FindFirst("userId")?.Value
                  ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(raw, out var uid) ? uid : 0;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ADMIN – APPROVE FORGOT CHECKOUT
    // ═══════════════════════════════════════════════════════════════════

    /// <summary>
    /// [Admin] Duyệt bản ghi "Quên check-out":
    /// ghi nhận CheckOutTime bằng EndTime của ca làm việc gắn với bản ghi,
    /// tính lại ActualHours / OvertimeHours, giữ nguyên Status Late/OnTime.
    /// </summary>
    [HttpPut("{attendanceId:int}/approve-forgot-checkout")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(AttendanceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveForgotCheckout(int attendanceId)
    {
        try
        {
            var adminUserId = GetCurrentUserId();
            var result = await _attendanceService.ApproveForgotCheckoutAsync(attendanceId, adminUserId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
