using System;
using System.Threading.Tasks;
using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;

namespace GpsAttendance.API.Controllers;

/// <summary>
/// SettingsController – cung cấp các tiện ích cấu hình hệ thống.
/// </summary>
[ApiController]
[Route("api/settings")]
[Produces("application/json")]
public class SettingsController : ControllerBase
{
    private readonly IGooglePlacesService _googlePlacesService;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;

    public SettingsController(
        IGooglePlacesService googlePlacesService,
        IConfiguration configuration,
        IWebHostEnvironment env)
    {
        _googlePlacesService = googlePlacesService;
        _configuration = configuration;
        _env = env;
    }

    /// <summary>[Admin] Gợi ý địa chỉ từ Google Places API Autocomplete</summary>
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
            var suggestions = await _googlePlacesService.AutocompleteAsync(input);
            return Ok(ApiResponseDto<object>.Ok(suggestions, "Lấy danh sách gợi ý thành công"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponseDto<object>.Fail(ex.Message));
        }
    }

    /// <summary>[Admin] Lấy tọa độ và địa chỉ chi tiết từ Google Places API Details</summary>
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
            var details = await _googlePlacesService.GetPlaceDetailsAsync(placeId);
            return Ok(ApiResponseDto<object>.Ok(details, "Lấy thông tin địa điểm thành công"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponseDto<object>.Fail(ex.Message));
        }
    }

    /// <summary>[Public Debug] API debug tạm thời kiểm tra Google Places API</summary>
    [HttpGet("google-places-debug")]
    [AllowAnonymous]
    public async Task<IActionResult> DebugGooglePlaces([FromQuery] string input)
    {
        var apiKey = _configuration["GoogleMaps:PlacesApiKey"] ?? "";
        
        Func<string, string> mask = (key) =>
        {
            if (string.IsNullOrWhiteSpace(key)) return "(empty)";
            if (key.Length <= 10) return "****";
            return $"{key[..6]}****{key[^4..]}";
        };

        var responseData = new System.Collections.Generic.Dictionary<string, object>
        {
            { "environment", _env.EnvironmentName },
            { "hasApiKey", !string.IsNullOrWhiteSpace(apiKey) },
            { "maskedApiKey", mask(apiKey) }
        };

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            responseData.Add("success", false);
            responseData.Add("message", "Google Places API key chưa được cấu hình tại GoogleMaps:PlacesApiKey");
            responseData.Add("hint", "Kiểm tra appsettings.Development.json và môi trường chạy backend.");
            return BadRequest(responseData);
        }

        try
        {
            var suggestions = await _googlePlacesService.AutocompleteAsync(
                string.IsNullOrWhiteSpace(input) ? "960 tran hung dao" : input
            );
            responseData.Add("googleStatusCode", 200);
            responseData.Add("success", true);
            responseData.Add("suggestionCount", suggestions.Count);
            return Ok(responseData);
        }
        catch (Exception ex)
        {
            int googleStatusCode = 403;
            if (ex.Message.Contains("400") || ex.Message.Contains("không hợp lệ") || ex.Message.Contains("BadRequest"))
            {
                googleStatusCode = 400;
            }

            responseData.Add("googleStatusCode", googleStatusCode);
            responseData.Add("success", false);
            responseData.Add("message", ex.Message);
            responseData.Add("hint", "Kiểm tra Billing, Places API, API restrictions hoặc key cũ");
            return BadRequest(responseData);
        }
    }
}
