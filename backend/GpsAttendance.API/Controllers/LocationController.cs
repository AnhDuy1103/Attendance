using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.DTOs.Location;
using GpsAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GpsAttendance.API.Controllers;

/// <summary>
/// LocationController – quản lý địa điểm chấm công.
/// Tất cả nhân viên có thể xem danh sách địa điểm.
/// Chỉ Admin mới được thêm/sửa/xoá.
/// </summary>
[ApiController]
[Route("api/locations")]
[Authorize]
[Produces("application/json")]
public class LocationController : ControllerBase
{
    private readonly LocationService _locationService;
    private readonly ILogger<LocationController> _logger;

    public LocationController(LocationService locationService, ILogger<LocationController> logger)
    {
        _locationService = locationService;
        _logger = logger;
    }

    /// <summary>[Employee/Admin] Lấy danh sách tất cả địa điểm chấm công đang hoạt động</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<LocationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var dtos = await _locationService.GetAllActiveAsync();
        var list = dtos.ToList();
        return Ok(ApiResponseDto<IEnumerable<LocationDto>>.Ok(list,
            $"Tìm thấy {list.Count} địa điểm"));
    }

    /// <summary>[Employee/Admin] Lấy thông tin chi tiết một địa điểm theo ID</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponseDto<LocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var dto = await _locationService.GetByIdAsync(id);
        if (dto == null)
            return NotFound(ApiResponseDto<object>.Fail($"Không tìm thấy địa điểm ID: {id}"));

        return Ok(ApiResponseDto<LocationDto>.Ok(dto));
    }

    /// <summary>[Admin] Thêm địa điểm chấm công mới</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<LocationDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateLocationDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ"));

        var dto = await _locationService.CreateAsync(request);

        return CreatedAtAction(nameof(GetById), new { id = dto.LocationId },
            ApiResponseDto<LocationDto>.Ok(dto, "Thêm địa điểm thành công"));
    }

    /// <summary>[Admin] Vô hiệu hoá địa điểm (soft delete)</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, message) = await _locationService.DeleteAsync(id);

        if (!success)
            return NotFound(ApiResponseDto<object>.Fail(message));

        return Ok(ApiResponseDto<object>.Ok(null!, message));
    }
}
