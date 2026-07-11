using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.DTOs.Employee;
using GpsAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GpsAttendance.API.Controllers;

/// <summary>
/// EmployeeController – quản lý CRUD nhân viên.
/// Chỉ Admin mới có quyền tạo, sửa, xoá nhân viên.
/// Employee có thể xem thông tin của bản thân.
/// </summary>
[ApiController]
[Route("api/employees")]
[Authorize]
[Produces("application/json")]
public class EmployeeController : ControllerBase
{
    private readonly EmployeeService _employeeService;
    private readonly ILogger<EmployeeController> _logger;

    public EmployeeController(EmployeeService employeeService, ILogger<EmployeeController> logger)
    {
        _employeeService = employeeService;
        _logger = logger;
    }

    /// <summary>
    /// [Admin] Lấy danh sách tất cả nhân viên (có phân trang và tìm kiếm).
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<PagedResultDto<EmployeeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? department = null,
        [FromQuery] string? keyword = null)
    {
        var result = await _employeeService.GetPagedAsync(page, pageSize, department, keyword);
        return Ok(ApiResponseDto<PagedResultDto<EmployeeDto>>.Ok(result,
            $"Tìm thấy {result.TotalCount} nhân viên"));
    }

    /// <summary>
    /// [Admin/Employee] Lấy thông tin chi tiết một nhân viên theo ID.
    /// Employee chỉ xem được thông tin của mình.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponseDto<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var dto = await _employeeService.GetByIdAsync(id);
        if (dto == null)
            return NotFound(ApiResponseDto<object>.Fail($"Không tìm thấy nhân viên ID: {id}"));

        return Ok(ApiResponseDto<EmployeeDto>.Ok(dto));
    }

    /// <summary>
    /// [Employee] Xem thông tin hồ sơ cá nhân của chính mình.
    /// </summary>
    [HttpGet("me")]
    [Authorize(Roles = "Employee,Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(ApiResponseDto<object>.Fail("Không xác định được thông tin người dùng từ token"));

        var dto = await _employeeService.GetByUserIdAsync(userId);
        if (dto == null)
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy hồ sơ nhân viên của bạn"));

        return Ok(ApiResponseDto<EmployeeDto>.Ok(dto, "Thông tin hồ sơ cá nhân"));
    }

    /// <summary>
    /// [Employee] Cập nhật thông tin hồ sơ cá nhân.
    /// </summary>
    [HttpPut("me")]
    [Authorize(Roles = "Employee,Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ"));

        var userIdClaim = User.FindFirst("userId")?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(ApiResponseDto<object>.Fail("Không xác định được thông tin người dùng từ token"));

        var employee = await _employeeService.GetByUserIdAsync(userId);
        if (employee == null)
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy hồ sơ nhân viên của bạn"));

        var updateDto = new UpdateEmployeeDto
        {
            FullName = request.FullName,
            Email = request.Email
        };

        var (success, message, dto) = await _employeeService.UpdateAsync(employee.EmployeeId, updateDto);
        if (!success)
            return BadRequest(ApiResponseDto<object>.Fail(message));

        return Ok(ApiResponseDto<EmployeeDto>.Ok(dto!, "Cập nhật thông tin hồ sơ thành công"));
    }


    /// <summary>
    /// [Admin] Tạo nhân viên mới kèm tài khoản đăng nhập.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<EmployeeDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ"));

        var (success, message, dto) = await _employeeService.CreateAsync(request);

        if (!success)
            return BadRequest(ApiResponseDto<object>.Fail(message));

        return CreatedAtAction(nameof(GetById), new { id = dto!.EmployeeId },
            ApiResponseDto<EmployeeDto>.Ok(dto, message));
    }

    /// <summary>
    /// [Admin] Cập nhật thông tin nhân viên.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeDto request)
    {
        var (success, message, dto) = await _employeeService.UpdateAsync(id, request);

        if (!success)
            return NotFound(ApiResponseDto<object>.Fail(message));

        return Ok(ApiResponseDto<EmployeeDto>.Ok(dto!, message));
    }

    /// <summary>
    /// [Admin] Vô hiệu hoá tài khoản nhân viên (soft delete).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, message) = await _employeeService.DeleteAsync(id);

        if (!success)
            return NotFound(ApiResponseDto<object>.Fail(message));

        return Ok(ApiResponseDto<object>.Ok(null!, message));
    }
}
