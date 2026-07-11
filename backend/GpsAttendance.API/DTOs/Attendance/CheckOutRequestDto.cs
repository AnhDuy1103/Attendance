using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Attendance;

/// <summary>DTO nhận thông tin khi nhân viên thực hiện Check-out</summary>
public class CheckOutRequestDto
{
    /// <summary>Vĩ độ GPS của nhân viên khi check-out</summary>
    [Required(ErrorMessage = "Latitude là bắt buộc")]
    [Range(-90.0, 90.0, ErrorMessage = "Latitude phải từ -90 đến 90")]
    public double Latitude { get; set; }

    /// <summary>Kinh độ GPS của nhân viên khi check-out</summary>
    [Required(ErrorMessage = "Longitude là bắt buộc")]
    [Range(-180.0, 180.0, ErrorMessage = "Longitude phải từ -180 đến 180")]
    public double Longitude { get; set; }

    /// <summary>Ghi chú tuỳ chọn</summary>
    [MaxLength(500)]
    public string? Note { get; set; }
}
