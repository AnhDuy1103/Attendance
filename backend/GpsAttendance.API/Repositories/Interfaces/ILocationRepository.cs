using GpsAttendance.API.Models;

namespace GpsAttendance.API.Repositories.Interfaces;

/// <summary>
/// Interface đặc thù cho Location Repository.
/// Cung cấp các phương thức tìm kiếm địa điểm đang hoạt động
/// và tìm kiếm theo tên.
/// </summary>
public interface ILocationRepository : IGenericRepository<Location>
{
    /// <summary>Lấy tất cả địa điểm đang hoạt động (IsActive = true)</summary>
    Task<IEnumerable<Location>> GetActiveLocationsAsync();

    /// <summary>Tìm địa điểm theo tên (hỗ trợ tìm kiếm một phần)</summary>
    Task<IEnumerable<Location>> SearchByNameAsync(string name);

    /// <summary>Lấy địa điểm mặc định (LocationId = 1)</summary>
    Task<Location?> GetDefaultLocationAsync();
}
