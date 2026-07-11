using GpsAttendance.API.Data;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Repositories;

/// <summary>
/// Triển khai AttendanceRepository – xử lý truy vấn chấm công phức tạp
/// bao gồm kiểm tra trạng thái check-in, lịch sử và báo cáo.
/// </summary>
public class AttendanceRepository : GenericRepository<Attendance>, IAttendanceRepository
{
    public AttendanceRepository(AppDbContext context) : base(context) { }

    /// <inheritdoc/>
    public async Task<Attendance?> GetOpenAttendanceAsync(int employeeId)
    {
        // Lấy bản ghi chưa check-out trong ngày hôm nay của nhân viên
        var today = Helpers.DateTimeHelper.GetVietnamNow().Date;
        return await _dbSet
            .Where(a => a.EmployeeId == employeeId
                     && a.CheckOutTime == null
                     && a.CheckInTime.Date == today)
            .OrderByDescending(a => a.CheckInTime)
            .FirstOrDefaultAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Attendance>> GetHistoryAsync(
        int employeeId, DateTime fromDate, DateTime toDate)
        => await _dbSet
            .Where(a => a.EmployeeId == employeeId
                     && a.CheckInTime >= fromDate
                     && a.CheckInTime <= toDate)
            .OrderByDescending(a => a.CheckInTime)
            .ToListAsync();

    /// <inheritdoc/>
    public async Task<IEnumerable<Attendance>> GetHistoryWithDetailsAsync(
        int employeeId, DateTime fromDate, DateTime toDate)
        => await _dbSet
            .Include(a => a.Employee)           // Eager load nhân viên
                .ThenInclude(e => e.User)       // Và tài khoản của nhân viên
            .Include(a => a.WorkingHours)       // Eager load ca làm
            .Include(a => a.Location)           // Eager load địa điểm
            .Where(a => a.EmployeeId == employeeId
                     && a.CheckInTime >= fromDate
                     && a.CheckInTime <= toDate)
            .OrderByDescending(a => a.CheckInTime)
            .ToListAsync();

    /// <inheritdoc/>
    public async Task<IEnumerable<Attendance>> GetTodayAttendancesAsync()
    {
        var today = Helpers.DateTimeHelper.GetVietnamNow().Date;
        return await _dbSet
            .Include(a => a.Employee)
                .ThenInclude(e => e.User)
            .Include(a => a.Location)
            .Where(a => a.CheckInTime.Date == today)
            .OrderByDescending(a => a.CheckInTime)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Attendance>> GetAllWithDetailsAsync(DateTime fromDate, DateTime toDate)
    {
        return await _dbSet
            .Include(a => a.Employee)
                .ThenInclude(e => e.User)
            .Include(a => a.WorkingHours)
            .Include(a => a.Location)
            .Where(a => a.CheckInTime >= fromDate && a.CheckInTime <= toDate)
            .OrderByDescending(a => a.CheckInTime)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<Attendance?> GetByIdWithDetailsAsync(int attendanceId)
        => await _dbSet
            .Include(a => a.Employee)
                .ThenInclude(e => e.User)
            .Include(a => a.WorkingHours)
            .Include(a => a.Location)
            .FirstOrDefaultAsync(a => a.AttendanceId == attendanceId);

    /// <inheritdoc/>
    public async Task<IEnumerable<Attendance>> GetMonthlyReportAsync(
        int employeeId, int year, int month)
        => await _dbSet
            .Include(a => a.WorkingHours)
            .Include(a => a.Location)
            .Where(a => a.EmployeeId == employeeId
                     && a.CheckInTime.Year == year
                     && a.CheckInTime.Month == month)
            .OrderBy(a => a.CheckInTime)
            .ToListAsync();

    /// <inheritdoc/>
    public async Task<int> CountWorkingDaysAsync(int employeeId, int year, int month)
    {
        // Đếm số ngày duy nhất có chấm công trong tháng
        var records = await _dbSet
            .Where(a => a.EmployeeId == employeeId
                     && a.CheckInTime.Year == year
                     && a.CheckInTime.Month == month)
            .Select(a => a.CheckInTime.Date)
            .Distinct()
            .CountAsync();
        return records;
    }
}
