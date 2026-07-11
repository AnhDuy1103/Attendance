using System.Collections.Generic;
using System.Threading.Tasks;
using GpsAttendance.API.DTOs.Location;

namespace GpsAttendance.API.Services.Interfaces;

/// <summary>
/// Giao diện dịch vụ tương tác với Google Places API.
/// </summary>
public interface IGooglePlacesService
{
    /// <summary>Gợi ý địa chỉ dựa trên chuỗi nhập vào</summary>
    Task<List<PlaceAutocompleteDto>> AutocompleteAsync(string input);

    /// <summary>Lấy thông tin chi tiết địa điểm từ placeId</summary>
    Task<PlaceDetailsDto> GetPlaceDetailsAsync(string placeId);
}
