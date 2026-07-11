using AutoMapper;
using GpsAttendance.API.DTOs.Location;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;

namespace GpsAttendance.API.Services;

/// <summary>
/// LocationService – xử lý nghiệp vụ quản lý địa điểm chấm công.
/// </summary>
public class LocationService
{
    private readonly ILocationRepository _locationRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<LocationService> _logger;

    public LocationService(
        ILocationRepository locationRepository,
        IMapper mapper,
        ILogger<LocationService> logger)
    {
        _locationRepository = locationRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>Lấy danh sách tất cả địa điểm đang hoạt động</summary>
    public async Task<IEnumerable<LocationDto>> GetAllActiveAsync()
    {
        var locations = await _locationRepository.GetActiveLocationsAsync();
        return _mapper.Map<IEnumerable<LocationDto>>(locations);
    }

    /// <summary>Lấy thông tin chi tiết một địa điểm</summary>
    public async Task<LocationDto?> GetByIdAsync(int id)
    {
        var location = await _locationRepository.GetByIdAsync(id);
        return location == null ? null : _mapper.Map<LocationDto>(location);
    }

    /// <summary>Tạo địa điểm chấm công mới</summary>
    public async Task<LocationDto> CreateAsync(CreateLocationDto request)
    {
        var location = _mapper.Map<Location>(request);
        location.IsActive = true;

        await _locationRepository.AddAsync(location);
        await _locationRepository.SaveChangesAsync();

        _logger.LogInformation("Thêm địa điểm mới: {Name}", location.LocationName);
        return _mapper.Map<LocationDto>(location);
    }

    /// <summary>Cập nhật thông tin địa điểm</summary>
    public async Task<(bool Success, string Message, LocationDto? Data)> UpdateAsync(int id, UpdateLocationDto request)
    {
        var location = await _locationRepository.GetByIdAsync(id);
        if (location == null)
            return (false, $"Không tìm thấy địa điểm ID: {id}", null);

        // Cập nhật từng field nếu có giá trị
        if (request.LocationName != null) location.LocationName = request.LocationName;
        if (request.Latitude.HasValue) location.Latitude = request.Latitude.Value;
        if (request.Longitude.HasValue) location.Longitude = request.Longitude.Value;
        if (request.Radius.HasValue) location.Radius = request.Radius.Value;
        if (request.Address != null) location.Address = request.Address;
        if (request.IsActive.HasValue) location.IsActive = request.IsActive.Value;

        _locationRepository.Update(location);
        await _locationRepository.SaveChangesAsync();

        return (true, "Cập nhật địa điểm thành công", _mapper.Map<LocationDto>(location));
    }

    /// <summary>Vô hiệu hóa địa điểm (soft delete)</summary>
    public async Task<(bool Success, string Message)> DeleteAsync(int id)
    {
        var location = await _locationRepository.GetByIdAsync(id);
        if (location == null)
            return (false, $"Không tìm thấy địa điểm ID: {id}");

        location.IsActive = false;
        _locationRepository.Update(location);
        await _locationRepository.SaveChangesAsync();

        _logger.LogInformation("Vô hiệu hóa địa điểm: {Name}", location.LocationName);
        return (true, $"Đã vô hiệu hóa địa điểm {location.LocationName}");
    }
}
