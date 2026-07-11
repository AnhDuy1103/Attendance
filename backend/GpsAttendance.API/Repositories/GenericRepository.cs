using System.Linq.Expressions;
using GpsAttendance.API.Data;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Repositories;

/// <summary>
/// Generic Repository – implement các phương thức CRUD chung cho mọi entity.
/// Các Repository cụ thể sẽ kế thừa lớp này để tái sử dụng code.
/// </summary>
/// <typeparam name="T">Kiểu Entity</typeparam>
public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<T>> GetAllAsync()
        => await _dbSet.ToListAsync();

    /// <inheritdoc/>
    public async Task<T?> GetByIdAsync(int id)
        => await _dbSet.FindAsync(id);

    /// <inheritdoc/>
    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.Where(predicate).ToListAsync();

    /// <inheritdoc/>
    public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.FirstOrDefaultAsync(predicate);

    /// <inheritdoc/>
    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    /// <inheritdoc/>
    public void Update(T entity)
        => _dbSet.Update(entity);

    /// <inheritdoc/>
    public void Delete(T entity)
        => _dbSet.Remove(entity);

    /// <inheritdoc/>
    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.AnyAsync(predicate);

    /// <inheritdoc/>
    public async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        if (predicate == null)
            return await _dbSet.CountAsync();
        return await _dbSet.CountAsync(predicate);
    }

    /// <inheritdoc/>
    public async Task<int> SaveChangesAsync()
        => await _context.SaveChangesAsync();
}
