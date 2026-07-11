namespace GpsAttendance.API.Services;

/// <summary>
/// HaversineService – tính khoảng cách giữa hai tọa độ GPS trên mặt đất.
/// Sử dụng công thức Haversine (đơn vị: mét).
///
/// Công thức:
///   a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
///   c = 2 × atan2(√a, √(1−a))
///   d = R × c
/// Trong đó R = 6371000 m (bán kính Trái Đất).
/// </summary>
public class HaversineService
{
    /// <summary>Bán kính trung bình của Trái Đất tính bằng mét</summary>
    private const double EarthRadiusMeters = 6_371_000.0;

    /// <summary>
    /// Tính khoảng cách giữa hai điểm GPS theo công thức Haversine.
    /// </summary>
    /// <param name="lat1">Vĩ độ điểm 1 (độ thập phân)</param>
    /// <param name="lon1">Kinh độ điểm 1 (độ thập phân)</param>
    /// <param name="lat2">Vĩ độ điểm 2 (độ thập phân)</param>
    /// <param name="lon2">Kinh độ điểm 2 (độ thập phân)</param>
    /// <returns>Khoảng cách tính bằng mét</returns>
    public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        // Chuyển đổi từ độ sang radian
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var rLat1 = ToRadians(lat1);
        var rLat2 = ToRadians(lat2);

        // Tính thành phần a theo công thức Haversine
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(rLat1) * Math.Cos(rLat2)
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        // Tính góc trung tâm c
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        // Khoảng cách = R × c
        return EarthRadiusMeters * c;
    }

    /// <summary>
    /// Kiểm tra nhân viên có đang ở trong phạm vi cho phép chấm công không.
    /// </summary>
    /// <param name="employeeLat">Vĩ độ của nhân viên</param>
    /// <param name="employeeLon">Kinh độ của nhân viên</param>
    /// <param name="locationLat">Vĩ độ của địa điểm công ty</param>
    /// <param name="locationLon">Kinh độ của địa điểm công ty</param>
    /// <param name="radiusMeters">Bán kính cho phép tính bằng mét</param>
    /// <returns>true nếu nhân viên đang trong bán kính hợp lệ</returns>
    public bool IsWithinRadius(
        double employeeLat, double employeeLon,
        double locationLat, double locationLon,
        double radiusMeters)
    {
        var distance = CalculateDistance(employeeLat, employeeLon, locationLat, locationLon);
        return distance <= radiusMeters;
    }

    /// <summary>
    /// Lấy khoảng cách thực tế và kiểm tra hợp lệ, trả về tuple (isValid, distanceInMeters).
    /// </summary>
    public (bool IsValid, double DistanceMeters) CheckLocation(
        double employeeLat, double employeeLon,
        double locationLat, double locationLon,
        double radiusMeters)
    {
        var distance = CalculateDistance(employeeLat, employeeLon, locationLat, locationLon);
        return (distance <= radiusMeters, Math.Round(distance, 2));
    }

    /// <summary>Chuyển đổi góc từ độ (°) sang radian</summary>
    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}
