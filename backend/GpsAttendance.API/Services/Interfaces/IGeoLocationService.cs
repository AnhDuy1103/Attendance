using System.Threading.Tasks;
using GpsAttendance.API.Models;

namespace GpsAttendance.API.Services.Interfaces;

/// <summary>
/// Giao diện dịch vụ quản lý Geofencing và xác thực vị trí chấm công.
/// </summary>
public interface IGeoLocationService
{
    /// <summary>Lấy địa điểm chấm công active duy nhất</summary>
    Task<Location> GetActiveLocationAsync();

    /// <summary>Tính khoảng cách từ tọa độ hiện tại tới địa điểm chấm công</summary>
    double CalculateDistanceToActiveLocation(double currentLat, double currentLng, Location location);

    /// <summary>Xác thực tọa độ nằm trong bán kính cho phép của địa điểm active, ném BadRequest nếu ngoài bán kính</summary>
    Task ValidateWithinGeofenceAsync(double currentLat, double currentLng);
}
