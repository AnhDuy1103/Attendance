using GpsAttendance.API.Models;

namespace GpsAttendance.API.Repositories.Interfaces;

/// <summary>
/// Interface đặc thù cho Employee Repository.
/// Cung cấp các phương thức tìm kiếm, lọc nhân viên theo nhiều tiêu chí.
/// </summary>
public interface IEmployeeRepository : IGenericRepository<Employee>
{
    /// <summary>Lấy nhân viên kèm thông tin User liên kết</summary>
    Task<Employee?> GetByIdWithUserAsync(int employeeId);

    /// <summary>Lấy nhân viên theo UserId</summary>
    Task<Employee?> GetByUserIdAsync(int userId);

    /// <summary>Lấy tất cả nhân viên kèm thông tin User (dùng cho danh sách)</summary>
    Task<IEnumerable<Employee>> GetAllWithUserAsync();

    /// <summary>Lấy danh sách nhân viên theo phòng ban</summary>
    Task<IEnumerable<Employee>> GetByDepartmentAsync(string department);

    /// <summary>Tìm kiếm nhân viên theo từ khoá (tên, phòng ban, vị trí)</summary>
    Task<IEnumerable<Employee>> SearchAsync(string keyword);

    /// <summary>Lấy danh sách phân trang kèm filter</summary>
    Task<(IEnumerable<Employee> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? department = null,
        string? keyword = null);
}
