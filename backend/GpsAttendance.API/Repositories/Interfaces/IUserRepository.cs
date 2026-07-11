using GpsAttendance.API.Models;

namespace GpsAttendance.API.Repositories.Interfaces;

/// <summary>
/// Interface đặc thù cho User Repository.
/// Kế thừa IGenericRepository và bổ sung các phương thức
/// liên quan đến xác thực, tìm kiếm user.
/// </summary>
public interface IUserRepository : IGenericRepository<User>
{
    /// <summary>Tìm user theo PhoneNumber (dùng khi đăng nhập)</summary>
    Task<User?> GetByPhoneNumberAsync(string phoneNumber);

    /// <summary>Tìm user cùng với thông tin Employee liên kết</summary>
    Task<User?> GetByIdWithEmployeeAsync(int userId);

    /// <summary>Kiểm tra PhoneNumber đã tồn tại chưa</summary>
    Task<bool> IsPhoneNumberExistsAsync(string phoneNumber);

    /// <summary>Lấy tất cả user theo Role</summary>
    Task<IEnumerable<User>> GetByRoleAsync(string role);
}
