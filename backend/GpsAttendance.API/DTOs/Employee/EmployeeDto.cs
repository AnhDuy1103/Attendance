namespace GpsAttendance.API.DTOs.Employee;

/// <summary>DTO hiển thị thông tin nhân viên</summary>
public class EmployeeDto
{
    public int EmployeeId { get; set; }
    public int UserId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime? JoinDate { get; set; }
    public string EmployeeStatus { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
