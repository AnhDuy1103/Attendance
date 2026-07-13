using System.Collections.Generic;
using System.Threading.Tasks;
using GpsAttendance.API.DTOs.Location;

namespace GpsAttendance.API.Services.Interfaces;

public interface IPlaceSearchService
{
    Task<List<PlaceAutocompleteDto>> AutocompleteAsync(string input);

    Task<PlaceDetailsDto> GetPlaceDetailsAsync(string placeId);
}
