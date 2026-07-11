namespace GpsAttendance.API.DTOs.Location;

/// <summary>DTO hiển thị thông tin địa điểm</summary>
public class LocationDto
{
    public int LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    /// <summary>Bán kính cho phép chấm công (mét)</summary>
    public double Radius { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; }
}
