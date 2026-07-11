using GpsAttendance.API.Data;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Repositories;

/// <summary>
/// Triển khai UserRepository – xử lý các thao tác liên quan đến User
/// bao gồm xác thực và tìm kiếm theo nhiều tiêu chí.
/// </summary>
public class UserRepository : GenericRepository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    /// <inheritdoc/>
    public async Task<User?> GetByPhoneNumberAsync(string phoneNumber)
        => await _dbSet
            .FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber && u.IsActive);

    /// <inheritdoc/>
    public async Task<User?> GetByIdWithEmployeeAsync(int userId)
        => await _dbSet
            .Include(u => u.Employee)        // Eager load thông tin nhân viên
            .FirstOrDefaultAsync(u => u.Id == userId);

    /// <inheritdoc/>
    public async Task<bool> IsPhoneNumberExistsAsync(string phoneNumber)
        => await _dbSet.AnyAsync(u => u.PhoneNumber == phoneNumber);

    /// <inheritdoc/>
    public async Task<IEnumerable<User>> GetByRoleAsync(string role)
        => await _dbSet
            .Where(u => u.Role == role && u.IsActive)
            .ToListAsync();
}
