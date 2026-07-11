using GpsAttendance.API.Models;

namespace GpsAttendance.API.Repositories.Interfaces;

/// <summary>
/// Interface Repository cho WorkingHours.
/// Cung cấp các phương thức đặc thù ngoài CRUD cơ bản.
/// </summary>
public interface IWorkingHoursRepository : IGenericRepository<WorkingHours>
{
    /// <summary>Lấy tất cả ca làm việc đang hoạt động, sắp xếp theo giờ bắt đầu</summary>
    Task<IEnumerable<WorkingHours>> GetActiveShiftsAsync();

    /// <summary>Lấy ca làm việc mặc định (ca đầu tiên đang hoạt động)</summary>
    Task<WorkingHours?> GetDefaultWorkingHoursAsync();

    /// <summary>Kiểm tra ca làm việc có đang được dùng trong bảng Attendance không</summary>
    Task<bool> IsUsedInAttendanceAsync(int workingHourId);
}
