using System;

namespace GpsAttendance.API.Helpers;

/// <summary>
/// GeoHelper – cung cấp tính toán khoảng cách GPS đường chim bay sử dụng công thức Haversine.
/// </summary>
public static class GeoHelper
{
    private const double EarthRadiusMeters = 6371000.0;

    /// <summary>
    /// Tính khoảng cách bằng mét giữa hai điểm vĩ độ/kinh độ.
    /// </summary>
    public static double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var rLat1 = ToRadians(lat1);
        var rLat2 = ToRadians(lat2);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(rLat1) * Math.Cos(rLat2)
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusMeters * c;
    }

    private static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }
}
