using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GpsAttendance.API.Models;

/// <summary>
/// Đại diện cho địa điểm chấm công được cấu hình trong hệ thống.
/// Mỗi Location có tọa độ GPS và bán kính cho phép chấm công.
/// </summary>
public class Location
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int LocationId { get; set; }

    /// <summary>Tên địa điểm (ví dụ: Văn phòng Hà Nội, Chi nhánh HCM)</summary>
    [Required(ErrorMessage = "LocationName là bắt buộc")]
    [MaxLength(200)]
    public string LocationName { get; set; } = string.Empty;

    /// <summary>Vĩ độ (latitude) của địa điểm, phạm vi -90 đến 90</summary>
    [Required]
    [Range(-90.0, 90.0, ErrorMessage = "Latitude phải nằm trong khoảng -90 đến 90")]
    public double Latitude { get; set; }

    /// <summary>Kinh độ (longitude) của địa điểm, phạm vi -180 đến 180</summary>
    [Required]
    [Range(-180.0, 180.0, ErrorMessage = "Longitude phải nằm trong khoảng -180 đến 180")]
    public double Longitude { get; set; }

    /// <summary>Bán kính cho phép chấm công tính bằng mét (meter)</summary>
    [Required]
    [Range(1, 10000, ErrorMessage = "Radius phải từ 1 đến 10000 mét")]
    public double Radius { get; set; } = 100; // Mặc định 100 mét

    /// <summary>Địa chỉ</summary>
    [MaxLength(500)]
    public string? Address { get; set; }

    /// <summary>Trạng thái hoạt động của địa điểm</summary>
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    /// <summary>Danh sách bản ghi chấm công tại địa điểm này</summary>
    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
