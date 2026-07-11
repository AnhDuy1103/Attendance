using GpsAttendance.API.Data;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Repositories;

/// <summary>
/// WorkingHoursRepository – truy vấn database cho ca làm việc.
/// Kế thừa GenericRepository để tái sử dụng CRUD cơ bản.
/// </summary>
public class WorkingHoursRepository : GenericRepository<WorkingHours>, IWorkingHoursRepository
{
    public WorkingHoursRepository(AppDbContext context) : base(context) { }

    /// <inheritdoc/>
    public async Task<IEnumerable<WorkingHours>> GetActiveShiftsAsync()
        => await _context.WorkingHours
            .Where(w => w.IsActive)
            .OrderBy(w => w.StartTime)
            .ToListAsync();

    /// <inheritdoc/>
    public async Task<WorkingHours?> GetDefaultWorkingHoursAsync()
        => await _context.WorkingHours
            .Where(w => w.IsActive)
            .OrderBy(w => w.StartTime)
            .FirstOrDefaultAsync();

    /// <inheritdoc/>
    public async Task<bool> IsUsedInAttendanceAsync(int workingHourId)
        => await _context.Attendances
            .AnyAsync(a => a.WorkingHourId == workingHourId);
}
