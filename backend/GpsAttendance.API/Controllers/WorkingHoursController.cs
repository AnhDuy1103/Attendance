using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.DTOs.WorkingHours;
using GpsAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GpsAttendance.API.Controllers;

/// <summary>
/// WorkingHoursController – quản lý ca làm việc.
/// Tất cả nhân viên được xem danh sách ca.
/// Chỉ Admin được thêm/sửa/xoá ca.
/// </summary>
[ApiController]
[Route("api/workinghours")]
[Authorize]
[Produces("application/json")]
public class WorkingHoursController : ControllerBase
{
    private readonly WorkingHoursService _workingHoursService;
    private readonly ILogger<WorkingHoursController> _logger;

    public WorkingHoursController(WorkingHoursService workingHoursService, ILogger<WorkingHoursController> logger)
    {
        _workingHoursService = workingHoursService;
        _logger = logger;
    }

    /// <summary>[Employee/Admin] Lấy ca làm việc duy nhất đang hoạt động</summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(ApiResponseDto<WorkingHoursDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActive()
    {
        var dto = await _workingHoursService.GetActiveShiftAsync();
        return Ok(ApiResponseDto<WorkingHoursDto>.Ok(dto, "Lấy ca làm việc hoạt động thành công"));
    }

    /// <summary>[Employee/Admin] Lấy danh sách tất cả ca làm việc đang hoạt động</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<WorkingHoursDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var dtos = await _workingHoursService.GetAllActiveAsync();
        var list = dtos.ToList();
        return Ok(ApiResponseDto<IEnumerable<WorkingHoursDto>>.Ok(list,
            $"Tìm thấy {list.Count} ca làm việc"));
    }

    /// <summary>[Employee/Admin] Lấy thông tin một ca làm việc theo ID</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponseDto<WorkingHoursDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var dto = await _workingHoursService.GetByIdAsync(id);
        if (dto == null)
            return NotFound(ApiResponseDto<object>.Fail($"Không tìm thấy ca làm việc ID: {id}"));

        return Ok(ApiResponseDto<WorkingHoursDto>.Ok(dto));
    }

    /// <summary>[Admin] Thêm ca làm việc mới</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<WorkingHoursDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateWorkingHoursDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ"));

        var dto = await _workingHoursService.CreateAsync(request);
        _logger.LogInformation("Thêm ca làm: {WorkingHourId}", dto.WorkingHourId);
        return CreatedAtAction(nameof(GetById), new { id = dto.WorkingHourId },
            ApiResponseDto<WorkingHoursDto>.Ok(dto, "Thêm ca làm thành công"));
    }

    /// <summary>[Admin] Cập nhật thông tin ca làm việc</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<WorkingHoursDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateWorkingHoursDto request)
    {
        var (success, message, dto) = await _workingHoursService.UpdateAsync(id, request);

        if (!success)
            return NotFound(ApiResponseDto<object>.Fail(message));

        return Ok(ApiResponseDto<WorkingHoursDto>.Ok(dto!, message));
    }

    /// <summary>
    /// [Admin] Vô hiệu hoá ca làm việc (soft delete).
    /// Không cho phép xoá nếu ca đang được sử dụng trong bảng Attendance.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, message) = await _workingHoursService.DeleteAsync(id);

        if (!success)
        {
            // Phân biệt lỗi 404 và lỗi ràng buộc 400
            if (message.Contains("Không tìm thấy"))
                return NotFound(ApiResponseDto<object>.Fail(message));
            return BadRequest(ApiResponseDto<object>.Fail(message));
        }

        return Ok(ApiResponseDto<object>.Ok(null!, message));
    }
}
