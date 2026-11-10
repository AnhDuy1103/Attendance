using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GpsAttendance.API.Models;

/// <summary>Yêu cầu nhân viên đăng nhập bằng một thiết bị mới.</summary>
public class DeviceChangeRequest
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int RequestId { get; set; }

    public int UserId { get; set; }
    public virtual User User { get; set; } = null!;

    [Required, MaxLength(255)] public string DeviceTokenHash { get; set; } = string.Empty;
    [MaxLength(100)] public string? DeviceName { get; set; }
    [MaxLength(50)] public string? DevicePlatform { get; set; }
    [MaxLength(100)] public string? DeviceBrowser { get; set; }
    [MaxLength(50)] public string? IpAddress { get; set; }
    [Required] public string Status { get; set; } = "Pending";
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public int? ProcessedBy { get; set; }
    [MaxLength(500)] public string? Note { get; set; }
}
