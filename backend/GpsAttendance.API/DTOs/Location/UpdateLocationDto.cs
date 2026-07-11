using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Location;

/// <summary>DTO dùng khi cập nhật thông tin địa điểm chấm công</summary>
public class UpdateLocationDto
{
    [MaxLength(200)]
    public string? LocationName { get; set; }

    [Range(-90.0, 90.0)]
    public double? Latitude { get; set; }

    [Range(-180.0, 180.0)]
    public double? Longitude { get; set; }

    [Range(1, 10000)]
    public double? Radius { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    public bool? IsActive { get; set; }
}
