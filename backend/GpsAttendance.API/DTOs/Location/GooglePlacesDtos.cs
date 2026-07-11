namespace GpsAttendance.API.DTOs.Location;

public class PlaceAutocompleteDto
{
    public string PlaceId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class PlaceDetailsDto
{
    public string PlaceId { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}
