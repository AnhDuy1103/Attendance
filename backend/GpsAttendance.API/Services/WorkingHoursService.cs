using AutoMapper;
using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.DTOs.WorkingHours;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;

namespace GpsAttendance.API.Services;

/// <summary>
/// WorkingHoursService – xử lý nghiệp vụ quản lý ca làm việc.
/// Bao gồm CRUD và kiểm tra ràng buộc khi xóa.
/// </summary>
public class WorkingHoursService
{
    private readonly IWorkingHoursRepository _workingHoursRepository;
    private readonly IMapper _mapper;

    public WorkingHoursService(IWorkingHoursRepository workingHoursRepository, IMapper mapper)
    {
        _workingHoursRepository = workingHoursRepository;
        _mapper = mapper;
    }

    /// <summary>Lấy danh sách tất cả ca làm đang hoạt động</summary>
    public async Task<IEnumerable<WorkingHoursDto>> GetAllActiveAsync()
    {
        var shifts = await _workingHoursRepository.GetActiveShiftsAsync();
        return _mapper.Map<IEnumerable<WorkingHoursDto>>(shifts);
    }

    /// <summary>Lấy ca làm việc duy nhất đang hoạt động (tự động seed nếu rỗng)</summary>
    public async Task<WorkingHoursDto> GetActiveShiftAsync()
    {
        var shift = await _workingHoursRepository.GetDefaultWorkingHoursAsync();
        if (shift == null)
        {
            // Seed ca mặc định nếu trống
            var defaultShift = new WorkingHours
            {
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(17, 0, 0),
                ShiftDuration = 8.0,
                Overtime = 30,
                IsActive = true
            };
            await _workingHoursRepository.AddAsync(defaultShift);
            await _workingHoursRepository.SaveChangesAsync();
            return _mapper.Map<WorkingHoursDto>(defaultShift);
        }
        return _mapper.Map<WorkingHoursDto>(shift);
    }

    /// <summary>Lấy chi tiết một ca làm theo ID</summary>
    public async Task<WorkingHoursDto?> GetByIdAsync(int id)
    {
        var shift = await _workingHoursRepository.GetByIdAsync(id);
        return shift == null ? null : _mapper.Map<WorkingHoursDto>(shift);
    }

    /// <summary>Tạo ca làm mới</summary>
    public async Task<WorkingHoursDto> CreateAsync(CreateWorkingHoursDto request)
    {
        var shift = _mapper.Map<WorkingHours>(request);

        // Tự động tính ShiftDuration nếu không được truyền hoặc = 0
        if (shift.ShiftDuration <= 0)
            shift.ShiftDuration = Math.Round((shift.EndTime - shift.StartTime).TotalHours, 2);

        shift.IsActive = true;
        await _workingHoursRepository.AddAsync(shift);
        await _workingHoursRepository.SaveChangesAsync();

        return _mapper.Map<WorkingHoursDto>(shift);
    }

    /// <summary>Cập nhật ca làm</summary>
    public async Task<(bool Success, string Message, WorkingHoursDto? Data)> UpdateAsync(
        int id, UpdateWorkingHoursDto request)
    {
        var shift = await _workingHoursRepository.GetByIdAsync(id);
        if (shift == null)
            return (false, $"Không tìm thấy ca làm việc ID: {id}", null);

        var startTime = request.StartTime ?? shift.StartTime;
        var endTime = request.EndTime ?? shift.EndTime;

        if (endTime <= startTime)
            return (false, "Giờ kết thúc phải lớn hơn giờ bắt đầu", null);

        // Cập nhật từng field nếu có giá trị
        if (request.StartTime.HasValue) shift.StartTime = request.StartTime.Value;
        if (request.EndTime.HasValue) shift.EndTime = request.EndTime.Value;
        if (request.Overtime.HasValue)
            shift.Overtime = request.Overtime.Value;
        
        // Tính lại ShiftDuration nếu có thay đổi giờ
        if (request.ShiftDuration.HasValue && request.ShiftDuration.Value > 0)
            shift.ShiftDuration = request.ShiftDuration.Value;
        else
            shift.ShiftDuration = Math.Round((endTime - startTime).TotalHours, 2);

        // Đảm bảo chỉ có ca này là Active, các ca khác phải Deactive
        var allShifts = await _workingHoursRepository.GetAllAsync();
        foreach (var otherShift in allShifts)
        {
            if (otherShift.WorkingHourId != id)
            {
                otherShift.IsActive = false;
                _workingHoursRepository.Update(otherShift);
            }
        }
        shift.IsActive = true;

        _workingHoursRepository.Update(shift);
        await _workingHoursRepository.SaveChangesAsync();

        return (true, "Cập nhật ca làm thành công", _mapper.Map<WorkingHoursDto>(shift));
    }

    /// <summary>
    /// Vô hiệu hóa ca làm (soft delete).
    /// Không cho phép xóa nếu ca đang được sử dụng trong Attendance.
    /// </summary>
    public async Task<(bool Success, string Message)> DeleteAsync(int id)
    {
        var shift = await _workingHoursRepository.GetByIdAsync(id);
        if (shift == null)
            return (false, $"Không tìm thấy ca làm việc ID: {id}");

        // Kiểm tra ràng buộc: không cho phép xóa nếu đã có chấm công dùng ca này
        var isUsed = await _workingHoursRepository.IsUsedInAttendanceAsync(id);
        if (isUsed)
            return (false, $"Không thể xóa ca ID '{shift.WorkingHourId}' vì đã có bản ghi chấm công sử dụng ca này.");

        shift.IsActive = false;
        _workingHoursRepository.Update(shift);
        await _workingHoursRepository.SaveChangesAsync();

        return (true, $"Đã vô hiệu hóa ca làm ID '{shift.WorkingHourId}'");
    }
}
