using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using GpsAttendance.API.DTOs.Location;
using GpsAttendance.API.Services.Interfaces;

namespace GpsAttendance.API.Services;

public class NominatimPlacesService : IPlaceSearchService
{
    private const string BaseUrl = "https://nominatim.openstreetmap.org";
    private const string UserAgent = "GpsAttendanceLocalDemo/1.0";
    private static readonly SemaphoreSlim RequestLock = new(1, 1);
    private static DateTimeOffset _lastRequestAt = DateTimeOffset.MinValue;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<NominatimPlacesService> _logger;

    public NominatimPlacesService(
        IHttpClientFactory httpClientFactory,
        ILogger<NominatimPlacesService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<List<PlaceAutocompleteDto>> AutocompleteAsync(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            throw new ArgumentException("Từ khóa tìm kiếm không được để trống", nameof(input));

        var query = Uri.EscapeDataString(input.Trim());
        var url = $"{BaseUrl}/search?format=jsonv2&addressdetails=1&dedupe=1&limit=5&countrycodes=vn&accept-language=vi&q={query}";

        var results = await SendNominatimAsync<List<NominatimPlaceDto>>(url);
        var suggestions = new List<PlaceAutocompleteDto>();

        foreach (var result in results)
        {
            var lookupId = BuildLookupId(result.OsmType, result.OsmId);
            if (string.IsNullOrWhiteSpace(lookupId) || string.IsNullOrWhiteSpace(result.DisplayName))
                continue;

            suggestions.Add(new PlaceAutocompleteDto
            {
                PlaceId = lookupId,
                Description = result.DisplayName
            });
        }

        _logger.LogInformation("Nominatim autocomplete returned {Count} suggestions", suggestions.Count);
        return suggestions;
    }

    public async Task<PlaceDetailsDto> GetPlaceDetailsAsync(string placeId)
    {
        if (string.IsNullOrWhiteSpace(placeId))
            throw new ArgumentException("placeId không được để trống", nameof(placeId));

        var lookupId = placeId.Trim();
        if (!IsValidLookupId(lookupId))
            throw new ArgumentException("Mã địa điểm không hợp lệ", nameof(placeId));

        var url = $"{BaseUrl}/lookup?format=jsonv2&addressdetails=1&accept-language=vi&osm_ids={Uri.EscapeDataString(lookupId)}";
        var results = await SendNominatimAsync<List<NominatimPlaceDto>>(url);
        var result = results.FirstOrDefault()
            ?? throw new InvalidOperationException("Không tìm thấy thông tin địa điểm đã chọn");

        if (!TryParseCoordinate(result.Lat, out var latitude)
            || !TryParseCoordinate(result.Lon, out var longitude))
        {
            throw new InvalidOperationException("Địa điểm đã chọn không có tọa độ hợp lệ");
        }

        return new PlaceDetailsDto
        {
            PlaceId = lookupId,
            Address = result.DisplayName,
            Latitude = latitude,
            Longitude = longitude
        };
    }

    private async Task<T> SendNominatimAsync<T>(string url)
    {
        await RequestLock.WaitAsync();
        try
        {
            var elapsed = DateTimeOffset.UtcNow - _lastRequestAt;
            if (elapsed < TimeSpan.FromMilliseconds(1100))
                await Task.Delay(TimeSpan.FromMilliseconds(1100) - elapsed);

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.UserAgent.ParseAdd(UserAgent);
            request.Headers.Accept.ParseAdd("application/json");

            var httpClient = _httpClientFactory.CreateClient();
            using var response = await httpClient.SendAsync(request);
            _lastRequestAt = DateTimeOffset.UtcNow;

            var content = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Nominatim request failed. StatusCode={StatusCode}, Body={Body}",
                    response.StatusCode,
                    content);
                throw new Exception(BuildFriendlyErrorMessage(response.StatusCode));
            }

            return JsonSerializer.Deserialize<T>(content, JsonOptions)
                ?? throw new InvalidOperationException("Không đọc được phản hồi từ dịch vụ tìm địa chỉ");
        }
        finally
        {
            RequestLock.Release();
        }
    }

    private static string BuildFriendlyErrorMessage(System.Net.HttpStatusCode statusCode)
    {
        if (statusCode == System.Net.HttpStatusCode.TooManyRequests)
            return "Dịch vụ tìm địa chỉ đang bị giới hạn tần suất. Vui lòng thử lại sau.";

        return $"Không thể kết nối dịch vụ tìm địa chỉ (HTTP {(int)statusCode}). Vui lòng thử lại sau.";
    }

    private static string BuildLookupId(string osmType, long osmId)
    {
        if (osmId <= 0) return string.Empty;

        return osmType.ToLowerInvariant() switch
        {
            "node" => $"N{osmId}",
            "way" => $"W{osmId}",
            "relation" => $"R{osmId}",
            _ => string.Empty
        };
    }

    private static bool IsValidLookupId(string value)
    {
        if (value.Length < 2) return false;
        var prefix = value[0];
        return (prefix == 'N' || prefix == 'W' || prefix == 'R')
            && long.TryParse(value[1..], NumberStyles.None, CultureInfo.InvariantCulture, out _);
    }

    private static bool TryParseCoordinate(string value, out double coordinate)
        => double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out coordinate);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private sealed class NominatimPlaceDto
    {
        [JsonPropertyName("osm_type")]
        public string OsmType { get; set; } = string.Empty;

        [JsonPropertyName("osm_id")]
        public long OsmId { get; set; }

        [JsonPropertyName("display_name")]
        public string DisplayName { get; set; } = string.Empty;

        [JsonPropertyName("lat")]
        public string Lat { get; set; } = string.Empty;

        [JsonPropertyName("lon")]
        public string Lon { get; set; } = string.Empty;
    }
}
