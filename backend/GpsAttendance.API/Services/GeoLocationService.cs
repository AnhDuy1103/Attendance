using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using GpsAttendance.API.Helpers;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using GpsAttendance.API.Services.Interfaces;

namespace GpsAttendance.API.Services;

/// <summary>
/// Triển khai dịch vụ GeoLocationService.
/// </summary>
public class GeoLocationService : IGeoLocationService
{
    private readonly ILocationRepository _locationRepository;

    public GeoLocationService(ILocationRepository locationRepository)
    {
        _locationRepository = locationRepository;
    }

    /// <inheritdoc/>
    public async Task<Location> GetActiveLocationAsync()
    {
        var location = await _locationRepository.GetDefaultLocationAsync();
        if (location == null)
        {
            throw new BadHttpRequestException("Không tìm thấy địa điểm chấm công active nào trên hệ thống.");
        }
        return location;
    }

    /// <inheritdoc/>
    public double CalculateDistanceToActiveLocation(double currentLat, double currentLng, Location location)
    {
        return GeoHelper.CalculateDistanceMeters(currentLat, currentLng, location.Latitude, location.Longitude);
    }

    /// <inheritdoc/>
    public async Task ValidateWithinGeofenceAsync(double currentLat, double currentLng)
    {
        var location = await GetActiveLocationAsync();
        var distance = CalculateDistanceToActiveLocation(currentLat, currentLng, location);

        if (distance > location.Radius)
        {
            var roundedDistance = Math.Round(distance, 0);
            throw new BadHttpRequestException($"Bạn đang ở quá xa vị trí chấm công (Cách {roundedDistance}m). Vui lòng di chuyển vào khu vực cho phép.");
        }
    }
}
