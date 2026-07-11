using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using GpsAttendance.API.DTOs.Location;
using GpsAttendance.API.Services.Interfaces;

namespace GpsAttendance.API.Services;

/// <summary>
/// Trien khai dich vu Google Places API (New).
/// </summary>
public class GooglePlacesService : IGooglePlacesService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GooglePlacesService> _logger;
    private readonly string _apiKey;

    public GooglePlacesService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GooglePlacesService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _apiKey = configuration["GoogleMaps:PlacesApiKey"] ?? string.Empty;

        _logger.LogInformation(
            "Google Places API key loaded from GoogleMaps:PlacesApiKey = {ApiKey}",
            MaskApiKey(_apiKey)
        );

        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException(
                "Google Places API key chưa được cấu hình tại GoogleMaps:PlacesApiKey. Kiểm tra appsettings.Development.json và môi trường chạy backend."
            );
        }
    }

    private static string MaskApiKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) return "(empty)";
        if (key.Length <= 10) return "****";
        return $"{key[..6]}****{key[^4..]}";
    }

    private void EnsureApiKeyConfigured()
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException(
                "Google Places API key chưa được cấu hình tại GoogleMaps:PlacesApiKey. Kiểm tra appsettings.Development.json và môi trường chạy backend."
            );
        }
    }

    private static string BuildFriendlyErrorMessage(
        System.Net.HttpStatusCode statusCode, string rawBody)
    {
        if (rawBody.Contains("API_KEY_SERVICE_BLOCKED")
            || rawBody.Contains("AutocompletePlaces are blocked")
            || rawBody.Contains("PERMISSION_DENIED"))
        {
            return "Google Places API bị chặn. Hãy kiểm tra API restrictions, billing và API key backend.";
        }
        if (rawBody.Contains("API key not valid")
            || rawBody.Contains("INVALID_ARGUMENT")
            || rawBody.Contains("REQUEST_DENIED"))
        {
            return "API key Google Maps không hợp lệ hoặc yêu cầu bị từ chối. Vui lòng kiểm tra cấu hình.";
        }
        if (statusCode == System.Net.HttpStatusCode.Forbidden)
        {
            return "Google Places API trả lỗi 403. Có thể API key chưa được cấp quyền, chưa bật billing hoặc backend vẫn đang dùng key cũ.";
        }
        if (statusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            return "API key Google Maps không hợp lệ. Vui lòng kiểm tra lại cấu hình.";
        }
        if (statusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            return "Đã vượt quá giới hạn yêu cầu Google Places API. Vui lòng thử lại sau.";
        }
        return string.Format(
            "Không thể kết nối Google Places API (HTTP {0}). Vui lòng kiểm tra cấu hình API key.",
            (int)statusCode);
    }

    /// <inheritdoc/>
    public async Task<List<PlaceAutocompleteDto>> AutocompleteAsync(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            throw new ArgumentException("Từ khóa tìm kiếm không được để trống", nameof(input));

        EnsureApiKeyConfigured();

        _logger.LogInformation("Places Autocomplete: [{Input}] key={Masked}", input, MaskApiKey(_apiKey));

        var httpClient = _httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://places.googleapis.com/v1/places:autocomplete");

        request.Headers.Add("X-Goog-Api-Key", _apiKey);
        request.Headers.Add(
            "X-Goog-FieldMask",
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text");

        var bodyObj = new { input, languageCode = "vi", regionCode = "VN" };
        request.Content = new StringContent(
            JsonSerializer.Serialize(bodyObj), Encoding.UTF8, "application/json");

        var response = await httpClient.SendAsync(request);
        _logger.LogInformation("Places Autocomplete: HTTP {StatusCode}", response.StatusCode);

        if (!response.IsSuccessStatusCode)
        {
            var errContent = await response.Content.ReadAsStringAsync();
            _logger.LogError(
                "Google Places API error in Autocomplete (endpoint: POST places:autocomplete, input: {Input}). StatusCode={StatusCode}, Body={Body}",
                input, response.StatusCode, errContent);
            throw new Exception(BuildFriendlyErrorMessage(response.StatusCode, errContent));
        }

        var json = await response.Content.ReadAsStringAsync();
        var resultList = new List<PlaceAutocompleteDto>();

        using var doc = JsonDocument.Parse(json);
        if (doc.RootElement.TryGetProperty("suggestions", out var suggestions))
        {
            foreach (var s in suggestions.EnumerateArray())
            {
                if (s.TryGetProperty("placePrediction", out var pred))
                {
                    var pid  = pred.GetProperty("placeId").GetString() ?? string.Empty;
                    var desc = pred.GetProperty("text").GetProperty("text").GetString()
                               ?? string.Empty;
                    resultList.Add(new PlaceAutocompleteDto { PlaceId = pid, Description = desc });
                }
            }
        }

        _logger.LogInformation("Places Autocomplete: {Count} gợi ý", resultList.Count);
        return resultList;
    }

    /// <inheritdoc/>
    public async Task<PlaceDetailsDto> GetPlaceDetailsAsync(string placeId)
    {
        if (string.IsNullOrWhiteSpace(placeId))
            throw new ArgumentException("placeId không được để trống", nameof(placeId));

        EnsureApiKeyConfigured();

        _logger.LogInformation("Places Details: [{PlaceId}] key={Masked}", placeId, MaskApiKey(_apiKey));

        var httpClient = _httpClientFactory.CreateClient();
        var url = "https://places.googleapis.com/v1/places/" + Uri.EscapeDataString(placeId);

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("X-Goog-Api-Key", _apiKey);
        request.Headers.Add("X-Goog-FieldMask", "id,formattedAddress,location");

        var response = await httpClient.SendAsync(request);
        _logger.LogInformation("Places Details: HTTP {StatusCode}", response.StatusCode);

        if (!response.IsSuccessStatusCode)
        {
            var errContent = await response.Content.ReadAsStringAsync();
            _logger.LogError(
                "Google Places API error in GetPlaceDetails (endpoint: GET places/{PlaceId}). StatusCode={StatusCode}, Body={Body}",
                placeId, response.StatusCode, errContent);
            throw new Exception(BuildFriendlyErrorMessage(response.StatusCode, errContent));
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var id       = root.GetProperty("id").GetString() ?? string.Empty;
        var address  = root.GetProperty("formattedAddress").GetString() ?? string.Empty;
        var loc      = root.GetProperty("location");
        var latitude  = loc.GetProperty("latitude").GetDouble();
        var longitude = loc.GetProperty("longitude").GetDouble();

        _logger.LogInformation("Places Details: OK [{PlaceId}]", placeId);

        return new PlaceDetailsDto
        {
            PlaceId   = id,
            Address   = address,
            Latitude  = latitude,
            Longitude = longitude
        };
    }
}
