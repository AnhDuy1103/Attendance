using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GpsAttendance.API.Controllers;

[ApiController]
[Route("api/settings")]
[Produces("application/json")]
public class SettingsController : ControllerBase
{
    private readonly IPlaceSearchService _placeSearchService;

    public SettingsController(IPlaceSearchService placeSearchService)
    {
        _placeSearchService = placeSearchService;
    }

    /// <summary>[Admin] Gợi ý địa chỉ từ OpenStreetMap/Nominatim</summary>
    [HttpGet("place-autocomplete")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Autocomplete([FromQuery] string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Từ khóa tìm kiếm không được để trống"));
        }

        try
        {
            var suggestions = await _placeSearchService.AutocompleteAsync(input);
            return Ok(ApiResponseDto<object>.Ok(suggestions, "Lấy danh sách gợi ý thành công"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponseDto<object>.Fail(ex.Message));
        }
    }

    /// <summary>[Admin] Lấy tọa độ và địa chỉ chi tiết từ OpenStreetMap/Nominatim</summary>
    [HttpGet("place-details")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPlaceDetails([FromQuery] string placeId)
    {
        if (string.IsNullOrWhiteSpace(placeId))
        {
            return BadRequest(ApiResponseDto<object>.Fail("placeId không được để trống"));
        }

        try
        {
            var details = await _placeSearchService.GetPlaceDetailsAsync(placeId);
            return Ok(ApiResponseDto<object>.Ok(details, "Lấy thông tin địa điểm thành công"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponseDto<object>.Fail(ex.Message));
        }
    }
}
