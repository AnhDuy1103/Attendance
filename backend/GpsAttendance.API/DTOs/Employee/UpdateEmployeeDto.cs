using System.ComponentModel.DataAnnotations;

namespace GpsAttendance.API.DTOs.Employee;

/// <summary>DTO dùng khi cập nhật thông tin nhân viên</summary>
public class UpdateEmployeeDto
{
    [MaxLength(100)]
    public string? FullName { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(100)]
    public string? Department { get; set; }

    [MaxLength(100)]
    public string? Position { get; set; }

    [Phone]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(20)]
    public string? Role { get; set; }

    [MaxLength(50)]
    public string? EmployeeStatus { get; set; }

    public DateTime? JoinDate { get; set; }

    public bool? IsActive { get; set; }

    public string? Password { get; set; }
}
