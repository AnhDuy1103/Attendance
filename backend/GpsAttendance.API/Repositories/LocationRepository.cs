using GpsAttendance.API.Data;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Repositories;

/// <summary>
/// Triển khai LocationRepository – xử lý các thao tác liên quan đến địa điểm
/// chấm công, bao gồm lọc địa điểm đang hoạt động.
/// </summary>
public class LocationRepository : GenericRepository<Location>, ILocationRepository
{
    public LocationRepository(AppDbContext context) : base(context) { }

    /// <inheritdoc/>
    public async Task<IEnumerable<Location>> GetActiveLocationsAsync()
        => await _dbSet
            .Where(l => l.IsActive)
            .OrderBy(l => l.LocationName)
            .ToListAsync();

    /// <inheritdoc/>
    public async Task<IEnumerable<Location>> SearchByNameAsync(string name)
        => await _dbSet
            .Where(l => l.LocationName.ToLower().Contains(name.ToLower()))
            .ToListAsync();

    /// <inheritdoc/>
    public async Task<Location?> GetDefaultLocationAsync()
        => await _dbSet
            .Where(l => l.IsActive)
            .OrderBy(l => l.LocationId)
            .FirstOrDefaultAsync();
}
