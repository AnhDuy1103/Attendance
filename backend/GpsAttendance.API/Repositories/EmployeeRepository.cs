using GpsAttendance.API.Data;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Repositories;

/// <summary>
/// Triển khai EmployeeRepository – xử lý các thao tác liên quan đến Employee
/// bao gồm tìm kiếm, lọc và phân trang.
/// </summary>
public class EmployeeRepository : GenericRepository<Employee>, IEmployeeRepository
{
    public EmployeeRepository(AppDbContext context) : base(context) { }

    /// <inheritdoc/>
    public async Task<Employee?> GetByIdWithUserAsync(int employeeId)
        => await _dbSet
            .Include(e => e.User)            // Eager load thông tin tài khoản
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);

    /// <inheritdoc/>
    public async Task<Employee?> GetByUserIdAsync(int userId)
        => await _dbSet
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.UserId == userId);

    /// <inheritdoc/>
    public async Task<IEnumerable<Employee>> GetAllWithUserAsync()
        => await _dbSet
            .Include(e => e.User)
            .Where(e => e.User.IsActive)     // Chỉ lấy nhân viên có tài khoản đang active
            .OrderBy(e => e.FullName)
            .ToListAsync();

    /// <inheritdoc/>
    public async Task<IEnumerable<Employee>> GetByDepartmentAsync(string department)
        => await _dbSet
            .Include(e => e.User)
            .Where(e => e.Department == department && e.User.IsActive)
            .ToListAsync();

    /// <inheritdoc/>
    public async Task<IEnumerable<Employee>> SearchAsync(string keyword)
    {
        var lower = keyword.ToLower();
        return await _dbSet
            .Include(e => e.User)
            .Where(e => e.User.IsActive &&
                        (e.FullName.ToLower().Contains(lower) ||
                         e.Department.ToLower().Contains(lower) ||
                         e.Position.ToLower().Contains(lower) ||
                         e.User.PhoneNumber.ToLower().Contains(lower)))
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<(IEnumerable<Employee> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? department = null,
        string? keyword = null)
    {
        // Bắt đầu query
        var query = _dbSet
            .Include(e => e.User)
            .Where(e => e.User.IsActive)
            .AsQueryable();

        // Áp dụng bộ lọc theo phòng ban
        if (!string.IsNullOrEmpty(department))
            query = query.Where(e => e.Department == department);

        // Áp dụng tìm kiếm theo từ khoá
        if (!string.IsNullOrEmpty(keyword))
        {
            var lower = keyword.ToLower();
            query = query.Where(e =>
                e.FullName.ToLower().Contains(lower) ||
                e.Position.ToLower().Contains(lower));
        }

        // Đếm tổng số bản ghi trước khi phân trang
        var total = await query.CountAsync();

        // Áp dụng phân trang
        var items = await query
            .OrderBy(e => e.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }
}
