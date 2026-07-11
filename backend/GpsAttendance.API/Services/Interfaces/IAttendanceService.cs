using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GpsAttendance.API.DTOs.Attendance;

namespace GpsAttendance.API.Services.Interfaces;

/// <summary>
/// Giao diện dịch vụ nghiệp vụ chấm công GPS.
/// </summary>
public interface IAttendanceService
{
    /// <summary>Lấy trạng thái chấm công hôm nay của nhân viên</summary>
    Task<TodayAttendanceDto> GetTodayStatusAsync(int employeeId);

    /// <summary>Thực hiện check-in cho nhân viên bằng tọa độ GPS</summary>
    Task<(bool Success, string Message, AttendanceResponseDto? Data)> CheckInAsync(int employeeId, CheckInRequestDto request);

    /// <summary>Thực hiện check-out cho nhân viên bằng tọa độ GPS</summary>
    Task<(bool Success, string Message, AttendanceResponseDto? Data)> CheckOutAsync(int employeeId, CheckOutRequestDto request);

    /// <summary>Lấy lịch sử chấm công của nhân viên</summary>
    Task<IEnumerable<AttendanceResponseDto>> GetMyHistoryAsync(int employeeId, DateTime? fromDate = null, DateTime? toDate = null);

    /// <summary>Lấy toàn bộ bản ghi chấm công (dành cho Admin)</summary>
    Task<IEnumerable<AttendanceResponseDto>> GetAllAsync(DateTime? fromDate = null, DateTime? toDate = null);

    /// <summary>Lấy lịch sử chấm công của một nhân viên (dành cho Admin)</summary>
    Task<IEnumerable<AttendanceResponseDto>> GetByEmployeeAsync(int employeeId, DateTime? fromDate = null, DateTime? toDate = null);

    /// <summary>Báo cáo tổng hợp chấm công tháng của một nhân viên (dành cho Admin)</summary>
    Task<AttendanceReportDto?> GetMonthlyReportAsync(int employeeId, int year, int month);
}
