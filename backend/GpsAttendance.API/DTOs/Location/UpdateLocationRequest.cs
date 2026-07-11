using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Location;

/// <summary>DTO nhận yêu cầu chỉnh sửa vị trí từ Admin</summary>
public class UpdateLocationRequest
{
    [Required(ErrorMessage = "LocationName là bắt buộc")]
    [MaxLength(200)]
    public string LocationName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [Range(-90.0, 90.0, ErrorMessage = "Latitude phải từ -90 đến 90")]
    public double Latitude { get; set; }

    [Required]
    [Range(-180.0, 180.0, ErrorMessage = "Longitude phải từ -180 đến 180")]
    public double Longitude { get; set; }

    [Required]
    [Range(1, 10000, ErrorMessage = "Radius phải từ 1 đến 10000 mét")]
    public int Radius { get; set; }

    public bool IsActive { get; set; }
}
