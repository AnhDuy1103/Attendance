using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
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

        var candidates = GenerateSearchCandidates(input.Trim());
        var suggestions = new List<PlaceAutocompleteDto>();
        var seenPlaceIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // 1. Try Nominatim online search
        foreach (var candidate in candidates)
        {
            var query = Uri.EscapeDataString(candidate);
            var url = $"{BaseUrl}/search?format=jsonv2&addressdetails=1&dedupe=1&limit=8&countrycodes=vn&accept-language=vi&q={query}";

            try
            {
                var results = await SendNominatimAsync<List<NominatimPlaceDto>>(url);
                if (results != null && results.Count > 0)
                {
                    foreach (var result in results)
                    {
                        var lookupId = BuildLookupId(result.OsmType, result.OsmId);
                        if (string.IsNullOrWhiteSpace(lookupId) || string.IsNullOrWhiteSpace(result.DisplayName))
                            continue;

                        if (seenPlaceIds.Add(lookupId))
                        {
                            suggestions.Add(new PlaceAutocompleteDto
                            {
                                PlaceId = lookupId,
                                Description = result.DisplayName
                            });
                        }
                    }

                    if (suggestions.Count > 0)
                    {
                        _logger.LogInformation("Nominatim matched candidate '{Candidate}' with {Count} suggestions", candidate, suggestions.Count);
                        return suggestions;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Nominatim query failed for candidate '{Candidate}'", candidate);
            }
        }

        // 2. Fallback to local Vietnam places database
        var localMatches = SearchLocalPlaces(input.Trim());
        foreach (var place in localMatches)
        {
            if (seenPlaceIds.Add(place.PlaceId))
            {
                suggestions.Add(new PlaceAutocompleteDto
                {
                    PlaceId = place.PlaceId,
                    Description = place.Address
                });
            }
        }

        _logger.LogInformation("Autocomplete returned {Count} suggestions (fallback included) for input: '{Input}'", suggestions.Count, input);
        return suggestions;
    }

    public async Task<PlaceDetailsDto> GetPlaceDetailsAsync(string placeId)
    {
        if (string.IsNullOrWhiteSpace(placeId))
            throw new ArgumentException("placeId không được để trống", nameof(placeId));

        var lookupId = placeId.Trim();

        // Check local fallback places first
        if (lookupId.StartsWith("VN_", StringComparison.OrdinalIgnoreCase))
        {
            var localPlace = LocalVietnamPlaces.FirstOrDefault(p => p.PlaceId.Equals(lookupId, StringComparison.OrdinalIgnoreCase));
            if (localPlace != null)
            {
                return localPlace;
            }
        }

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

    public async Task<PlaceDetailsDto> ReverseGeocodeAsync(double latitude, double longitude)
    {
        var latStr = latitude.ToString(CultureInfo.InvariantCulture);
        var lonStr = longitude.ToString(CultureInfo.InvariantCulture);
        var url = $"{BaseUrl}/reverse?format=jsonv2&lat={latStr}&lon={lonStr}&accept-language=vi";

        try
        {
            var result = await SendNominatimAsync<NominatimPlaceDto>(url);
            if (result != null && !string.IsNullOrWhiteSpace(result.DisplayName))
            {
                var lookupId = BuildLookupId(result.OsmType, result.OsmId);
                return new PlaceDetailsDto
                {
                    PlaceId = string.IsNullOrWhiteSpace(lookupId) ? $"COORD_{latStr}_{lonStr}" : lookupId,
                    Address = result.DisplayName,
                    Latitude = latitude,
                    Longitude = longitude
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Reverse geocoding via Nominatim failed for lat={Lat}, lon={Lon}. Using fallback.", latitude, longitude);
        }

        // Fallback: Find closest known place or format coordinate
        var closest = FindClosestLocalPlace(latitude, longitude);
        var fallbackAddress = closest != null
            ? $"{closest.Address} (Tọa độ: {latitude:F4}, {longitude:F4})"
            : $"Vị trí tọa độ: {latitude:F4}, {longitude:F4}";

        return new PlaceDetailsDto
        {
            PlaceId = $"COORD_{latStr}_{lonStr}",
            Address = fallbackAddress,
            Latitude = latitude,
            Longitude = longitude
        };
    }

    private static List<string> GenerateSearchCandidates(string rawInput)
    {
        var candidates = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void AddCandidate(string? val)
        {
            if (string.IsNullOrWhiteSpace(val)) return;
            var trimmed = val.Trim();
            if (trimmed.Length >= 2 && seen.Add(trimmed))
            {
                candidates.Add(trimmed);
            }
        }

        // 1. Raw input
        AddCandidate(rawInput);

        // 2. Clean business prefixes/noise words
        var cleaned = Regex.Replace(
            rawInput,
            @"(?i)\b(công ty cp|công ty cổ phần|công ty tnhh mtv|công ty tnhh|công ty|tập đoàn|doanh nghiệp|nhà máy may|nhà máy|tòa nhà|trụ sở|văn phòng|chi nhánh|cửa hàng)\b",
            "",
            RegexOptions.Compiled).Trim();

        cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();
        AddCandidate(cleaned);

        // 3. Remove house number / lot number at start (e.g. "123 Lê Lợi" -> "Lê Lợi", "Số 10 Lê Duẩn" -> "Lê Duẩn")
        var withoutNumber = Regex.Replace(
            cleaned,
            @"^(số\s+)?(lô\s+)?\d+([a-zA-Z]|\/\d+)*\s*,?\s*",
            "",
            RegexOptions.IgnoreCase | RegexOptions.Compiled).Trim();
        AddCandidate(withoutNumber);

        // 4. If query contains commas, try broader portion
        var commaParts = rawInput.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (commaParts.Length >= 2)
        {
            var broader = string.Join(", ", commaParts.Skip(1));
            AddCandidate(broader);

            if (commaParts.Length >= 3)
            {
                var broadest = string.Join(", ", commaParts.Skip(commaParts.Length - 2));
                AddCandidate(broadest);
            }
        }

        return candidates.Take(4).ToList();
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

            var httpClient = _httpClientFactory.CreateClient("Nominatim");
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

    // ─────────────────────────────────────────────────────────────
    // Local Vietnam Places Fallback Database
    // ─────────────────────────────────────────────────────────────
    private static List<PlaceDetailsDto> SearchLocalPlaces(string keyword)
    {
        var normalizedKeyword = RemoveDiacritics(keyword.ToLowerInvariant());
        var words = normalizedKeyword.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        return LocalVietnamPlaces
            .Where(p =>
            {
                var normAddr = RemoveDiacritics(p.Address.ToLowerInvariant());
                return words.All(w => normAddr.Contains(w));
            })
            .Take(8)
            .ToList();
    }

    private static PlaceDetailsDto? FindClosestLocalPlace(double lat, double lon)
    {
        PlaceDetailsDto? closest = null;
        double minDistance = double.MaxValue;

        foreach (var p in LocalVietnamPlaces)
        {
            var dLat = (p.Latitude - lat) * 111.0;
            var dLon = (p.Longitude - lon) * 111.0 * Math.Cos(lat * Math.PI / 180.0);
            var dist = Math.Sqrt(dLat * dLat + dLon * dLon);
            if (dist < minDistance && dist < 50.0) // Within 50km
            {
                minDistance = dist;
                closest = p;
            }
        }

        return closest;
    }

    private static string RemoveDiacritics(string text)
    {
        var normalized = text.Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var c in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }
        return sb.ToString().Normalize(System.Text.NormalizationForm.FormC).Replace('đ', 'd').Replace('Đ', 'D');
    }

    private static readonly List<PlaceDetailsDto> LocalVietnamPlaces = new()
    {
        // Quang Nam / Da Nang (Vùng công ty Quang Hoa)
        new() { PlaceId = "VN_QUANG_HOA", Address = "Công ty TNHH Quang Hoa, KCN Điện Nam - Điện Ngọc, Thị xã Điện Bàn, Tỉnh Quảng Nam", Latitude = 15.9328, Longitude = 108.2831 },
        new() { PlaceId = "VN_DIEN_BAN", Address = "Thị xã Điện Bàn, Tỉnh Quảng Nam, Việt Nam", Latitude = 15.8794, Longitude = 108.3350 },
        new() { PlaceId = "VN_HOI_AN", Address = "Thành phố Hội An, Tỉnh Quảng Nam, Việt Nam", Latitude = 15.8801, Longitude = 108.3380 },
        new() { PlaceId = "VN_TAM_KY", Address = "Thành phố Tam Kỳ, Tỉnh Quảng Nam, Việt Nam", Latitude = 15.5684, Longitude = 108.4816 },
        new() { PlaceId = "VN_KCN_HOA_KHANH", Address = "Khu công nghiệp Hòa Khánh, Quận Liên Chiểu, Thành phố Đà Nẵng, Việt Nam", Latitude = 16.0710, Longitude = 108.1470 },
        new() { PlaceId = "VN_DA_NANG", Address = "Thành phố Đà Nẵng, Việt Nam", Latitude = 16.0544, Longitude = 108.2022 },
        new() { PlaceId = "VN_DN_HAI_CHAU", Address = "Quận Hải Châu, Thành phố Đà Nẵng, Việt Nam", Latitude = 16.0471, Longitude = 108.2208 },
        new() { PlaceId = "VN_DN_SON_TRA", Address = "Quận Sơn Trà, Thành phố Đà Nẵng, Việt Nam", Latitude = 16.0820, Longitude = 108.2430 },
        new() { PlaceId = "VN_DN_THANH_KHE", Address = "Quận Thanh Khê, Thành phố Đà Nẵng, Việt Nam", Latitude = 16.0600, Longitude = 108.1830 },
        new() { PlaceId = "VN_DN_NGU_HANH_SON", Address = "Quận Ngũ Hành Sơn, Thành phố Đà Nẵng, Việt Nam", Latitude = 16.0025, Longitude = 108.2520 },

        // Hà Nội & miền Bắc
        new() { PlaceId = "VN_HA_NOI", Address = "Thành phố Hà Nội, Việt Nam", Latitude = 21.0285, Longitude = 105.8542 },
        new() { PlaceId = "VN_HN_HOAN_KIEM", Address = "Quận Hoàn Kiếm, Thành phố Hà Nội, Việt Nam", Latitude = 21.0285, Longitude = 105.8542 },
        new() { PlaceId = "VN_HN_CAU_GIAY", Address = "Quận Cầu Giấy, Thành phố Hà Nội, Việt Nam", Latitude = 21.0333, Longitude = 105.7895 },
        new() { PlaceId = "VN_HN_BA_DINH", Address = "Quận Ba Đình, Thành phố Hà Nội, Việt Nam", Latitude = 21.0341, Longitude = 105.8239 },
        new() { PlaceId = "VN_HN_DONG_DA", Address = "Quận Đống Đa, Thành phố Hà Nội, Việt Nam", Latitude = 21.0180, Longitude = 105.8290 },
        new() { PlaceId = "VN_HN_HAI_BA_TRUNG", Address = "Quận Hai Bà Trưng, Thành phố Hà Nội, Việt Nam", Latitude = 21.0080, Longitude = 105.8520 },
        new() { PlaceId = "VN_HN_THANH_XUAN", Address = "Quận Thanh Xuân, Thành phố Hà Nội, Việt Nam", Latitude = 20.9980, Longitude = 105.8110 },
        new() { PlaceId = "VN_HN_NAM_TU_LIEM", Address = "Quận Nam Từ Liêm, Thành phố Hà Nội, Việt Nam", Latitude = 21.0160, Longitude = 105.7640 },
        new() { PlaceId = "VN_HN_HOANG_MAI", Address = "Quận Hoàng Mai, Thành phố Hà Nội, Việt Nam", Latitude = 20.9750, Longitude = 105.8450 },
        new() { PlaceId = "VN_HN_HA_DONG", Address = "Quận Hà Đông, Thành phố Hà Nội, Việt Nam", Latitude = 20.9720, Longitude = 105.7760 },
        new() { PlaceId = "VN_HN_HOA_LAC", Address = "Khu công nghệ cao Hòa Lạc, Huyện Thạch Thất, Thành phố Hà Nội, Việt Nam", Latitude = 20.9922, Longitude = 105.5342 },
        new() { PlaceId = "VN_HAI_PHONG", Address = "Thành phố Hải Phòng, Việt Nam", Latitude = 20.8449, Longitude = 106.6881 },
        new() { PlaceId = "VN_BAC_NINH", Address = "Tỉnh Bắc Ninh, Việt Nam", Latitude = 21.1861, Longitude = 106.0763 },
        new() { PlaceId = "VN_QUANG_NINH", Address = "Tỉnh Quảng Ninh, Việt Nam", Latitude = 21.0069, Longitude = 107.2925 },
        new() { PlaceId = "VN_HAI_DUONG", Address = "Tỉnh Hải Dương, Việt Nam", Latitude = 20.9373, Longitude = 106.3146 },
        new() { PlaceId = "VN_VINH_PHUC", Address = "Tỉnh Vĩnh Phúc, Việt Nam", Latitude = 21.3609, Longitude = 105.5474 },
        new() { PlaceId = "VN_THAI_NGUYEN", Address = "Tỉnh Thái Nguyên, Việt Nam", Latitude = 21.5942, Longitude = 105.8482 },

        // TP. Hồ Chí Minh & miền Nam
        new() { PlaceId = "VN_HO_CHI_MINH", Address = "Thành phố Hồ Chí Minh, Việt Nam", Latitude = 10.7769, Longitude = 106.7009 },
        new() { PlaceId = "VN_HCM_QUAN_1", Address = "Quận 1, Thành phố Hồ Chí Minh, Việt Nam", Latitude = 10.7756, Longitude = 106.7004 },
        new() { PlaceId = "VN_HCM_QUAN_3", Address = "Quận 3, Thành phố Hồ Chí Minh, Việt Nam", Latitude = 10.7844, Longitude = 106.6844 },
        new() { PlaceId = "VN_HCM_QUAN_7", Address = "Quận 7, Thành phố Hồ Chí Minh, Việt Nam", Latitude = 10.7340, Longitude = 106.7218 },
        new() { PlaceId = "VN_HCM_BINH_THANH", Address = "Quận Bình Thạnh, Thành phố Hồ Chí Minh, Việt Nam", Latitude = 10.8012, Longitude = 106.7107 },
        new() { PlaceId = "VN_HCM_TAN_BINH", Address = "Quận Tân Bình, Thành phố Hồ Chí Minh, Việt Nam", Latitude = 10.8015, Longitude = 106.6558 },
        new() { PlaceId = "VN_HCM_THU_DUC", Address = "Thành phố Thủ Đức, Thành phố Hồ Chí Minh, Việt Nam", Latitude = 10.8494, Longitude = 106.7537 },
        new() { PlaceId = "VN_BINH_DUONG", Address = "Tỉnh Bình Dương, Việt Nam", Latitude = 11.1322, Longitude = 106.6433 },
        new() { PlaceId = "VN_DONG_NAI", Address = "Tỉnh Đồng Nai, Việt Nam", Latitude = 10.9574, Longitude = 106.8427 },
        new() { PlaceId = "VN_BA_RIA_VUNG_TAU", Address = "Tỉnh Bà Rịa - Vũng Tàu, Việt Nam", Latitude = 10.4114, Longitude = 107.1362 },
        new() { PlaceId = "VN_CAN_THO", Address = "Thành phố Cần Thơ, Việt Nam", Latitude = 10.0452, Longitude = 105.7469 },
        new() { PlaceId = "VN_LONG_AN", Address = "Tỉnh Long An, Việt Nam", Latitude = 10.5443, Longitude = 106.4116 },

        // Miền Trung & Tây Nguyên
        new() { PlaceId = "VN_HUE", Address = "Thành phố Huế, Tỉnh Thừa Thiên Huế, Việt Nam", Latitude = 16.4637, Longitude = 107.5909 },
        new() { PlaceId = "VN_NHA_TRANG", Address = "Thành phố Nha Trang, Tỉnh Khánh Hòa, Việt Nam", Latitude = 12.2388, Longitude = 109.1967 },
        new() { PlaceId = "VN_DA_LAT", Address = "Thành phố Đà Lạt, Tỉnh Lâm Đồng, Việt Nam", Latitude = 11.9404, Longitude = 108.4583 },
        new() { PlaceId = "VN_BUON_MA_THUOT", Address = "Thành phố Buôn Ma Thuột, Tỉnh Đắk Lắk, Việt Nam", Latitude = 12.6667, Longitude = 108.0383 },
        new() { PlaceId = "VN_QUY_NHON", Address = "Thành phố Quy Nhơn, Tỉnh Bình Định, Việt Nam", Latitude = 13.7820, Longitude = 109.2197 },
        new() { PlaceId = "VN_VINH", Address = "Thành phố Vinh, Tỉnh Nghệ An, Việt Nam", Latitude = 18.6734, Longitude = 105.6923 },
        new() { PlaceId = "VN_THANH_HOA", Address = "Thành phố Thanh Hóa, Tỉnh Thanh Hóa, Việt Nam", Latitude = 19.8067, Longitude = 105.7852 }
    };
}
