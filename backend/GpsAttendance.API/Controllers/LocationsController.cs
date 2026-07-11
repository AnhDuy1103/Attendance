using System;
using System.Threading.Tasks;
using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.DTOs.Location;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace GpsAttendance.API.Controllers;

/// <summary>
/// LocationsController – xử lý các endpoint quản lý vị trí chấm công.
/// </summary>
[ApiController]
[Route("api/locations")]
[Authorize]
[Produces("application/json")]
public class LocationsController : ControllerBase
{
    private readonly ILocationRepository _locationRepository;

    public LocationsController(ILocationRepository locationRepository)
    {
        _locationRepository = locationRepository;
    }

    /// <summary>[Employee/Admin] Lấy vị trí chấm công active duy nhất</summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(ApiResponseDto<Location>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActive()
    {
        var location = await _locationRepository.GetDefaultLocationAsync();
        if (location == null)
        {
            // Seed vị trí mặc định nếu trống
            var defaultLoc = new Location
            {
                LocationName = "Văn phòng chính",
                Latitude = 15.879440,
                Longitude = 108.335000,
                Radius = 100,
                Address = "Cụm công nghiệp Tây An, Duy Xuyên, Đà Nẵng",
                IsActive = true
            };
            await _locationRepository.AddAsync(defaultLoc);
            await _locationRepository.SaveChangesAsync();
            return Ok(ApiResponseDto<Location>.Ok(defaultLoc, "Lấy vị trí chấm công active thành công"));
        }
        return Ok(ApiResponseDto<Location>.Ok(location, "Lấy vị trí chấm công active thành công"));
    }

    /// <summary>[Admin] Cập nhật vị trí chấm công</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<Location>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLocationRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<object>.Fail("Dữ liệu không hợp lệ"));

        var location = await _locationRepository.GetByIdAsync(id);
        if (location == null)
            return NotFound(ApiResponseDto<object>.Fail($"Không tìm thấy địa điểm ID: {id}"));

        // Validate các trường
        if (request.Radius <= 0)
            return BadRequest(ApiResponseDto<object>.Fail("Bán kính (Radius) phải lớn hơn 0"));

        if (request.Latitude < -90 || request.Latitude > 90)
            return BadRequest(ApiResponseDto<object>.Fail("Vĩ độ (Latitude) phải nằm trong khoảng từ -90 đến 90"));

        if (request.Longitude < -180 || request.Longitude > 180)
            return BadRequest(ApiResponseDto<object>.Fail("Kinh độ (Longitude) phải nằm trong khoảng từ -180 đến 180"));

        location.LocationName = request.LocationName;
        location.Address = request.Address;
        location.Latitude = request.Latitude;
        location.Longitude = request.Longitude;
        location.Radius = request.Radius;

        // Đảm bảo chỉ có địa điểm này active, các địa điểm khác deactive
        var allLocations = await _locationRepository.GetAllAsync();
        foreach (var loc in allLocations)
        {
            if (loc.LocationId != id)
            {
                loc.IsActive = false;
                _locationRepository.Update(loc);
            }
        }
        location.IsActive = true;

        _locationRepository.Update(location);
        await _locationRepository.SaveChangesAsync();

        return Ok(ApiResponseDto<Location>.Ok(location, "Cập nhật vị trí chấm công thành công"));
    }
}
