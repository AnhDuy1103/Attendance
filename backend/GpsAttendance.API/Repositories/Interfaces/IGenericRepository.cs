using System.Linq.Expressions;

namespace GpsAttendance.API.Repositories.Interfaces;

/// <summary>
/// Generic Repository Interface – định nghĩa các phương thức CRUD cơ bản
/// dùng chung cho tất cả các entity trong hệ thống.
/// </summary>
/// <typeparam name="T">Kiểu Entity</typeparam>
public interface IGenericRepository<T> where T : class
{
    /// <summary>Lấy tất cả bản ghi</summary>
    Task<IEnumerable<T>> GetAllAsync();

    /// <summary>Lấy bản ghi theo ID (primary key)</summary>
    Task<T?> GetByIdAsync(int id);

    /// <summary>Lấy bản ghi theo điều kiện lọc</summary>
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

    /// <summary>Lấy bản ghi đầu tiên thoả điều kiện (hoặc null)</summary>
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);

    /// <summary>Thêm một bản ghi mới</summary>
    Task<T> AddAsync(T entity);

    /// <summary>Cập nhật bản ghi</summary>
    void Update(T entity);

    /// <summary>Xoá bản ghi theo entity</summary>
    void Delete(T entity);

    /// <summary>Kiểm tra tồn tại bản ghi thoả điều kiện</summary>
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);

    /// <summary>Đếm số lượng bản ghi thoả điều kiện</summary>
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);

    /// <summary>Lưu thay đổi vào database</summary>
    Task<int> SaveChangesAsync();
}
