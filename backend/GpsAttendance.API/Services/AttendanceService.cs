using AutoMapper;
using GpsAttendance.API.DTOs.Attendance;
using GpsAttendance.API.Enums;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using GpsAttendance.API.Helpers;
using GpsAttendance.API.Services.Interfaces;

namespace GpsAttendance.API.Services;

/// <summary>
/// AttendanceService – xử lý toàn bộ nghiệp vụ chấm công GPS.
/// </summary>
public class AttendanceService : IAttendanceService
{
    private readonly IAttendanceRepository _attendanceRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ILocationRepository _locationRepository;
    private readonly IWorkingHoursRepository _workingHoursRepository;
    private readonly IGeoLocationService _geoLocationService;
    private readonly IMapper _mapper;

    public AttendanceService(
        IAttendanceRepository attendanceRepository,
        IEmployeeRepository employeeRepository,
        ILocationRepository locationRepository,
        IWorkingHoursRepository workingHoursRepository,
        IGeoLocationService geoLocationService,
        IMapper mapper)
    {
        _attendanceRepository = attendanceRepository;
        _employeeRepository = employeeRepository;
        _locationRepository = locationRepository;
        _workingHoursRepository = workingHoursRepository;
        _geoLocationService = geoLocationService;
        _mapper = mapper;
    }

    // ── GET TODAY STATUS ─────────────────────────────────────────────────────

    /// <summary>
    /// Lấy trạng thái chấm công hôm nay của nhân viên.
    /// </summary>
    public async Task<TodayAttendanceDto> GetTodayStatusAsync(int employeeId)
    {
        var today = DateTimeHelper.GetVietnamNow().Date;
        var attendance = await _attendanceRepository.FirstOrDefaultAsync(
            a => a.EmployeeId == employeeId && a.AttendanceDate == today);

        if (attendance == null)
        {
            return new TodayAttendanceDto
            {
                HasCheckedIn = false,
                HasCheckedOut = false,
                Status = "NotCheckedIn"
            };
        }

        return new TodayAttendanceDto
        {
            HasCheckedIn = true,
            HasCheckedOut = attendance.CheckOutTime != null,
            CheckInTime = attendance.CheckInTime,
            CheckOutTime = attendance.CheckOutTime,
            ActualHours = attendance.ActualHours,
            OvertimeHours = attendance.OvertimeHours ?? 0,
            Status = attendance.Status,
            Note = attendance.Note,
            AttendanceId = attendance.AttendanceId
        };
    }

    // ── CHECK-IN ────────────────────────────────────────────────────────────

    /// <summary>
    /// Thực hiện Check-in cho nhân viên.
    /// </summary>
    public async Task<(bool Success, string Message, AttendanceResponseDto? Data)> CheckInAsync(
        int employeeId, CheckInRequestDto request)
    {
        // Bước 1: Kiểm tra nhân viên tồn tại
        var employee = await _employeeRepository.GetByIdWithUserAsync(employeeId);
        if (employee == null)
            return (false, "Không tìm thấy thông tin nhân viên", null);

        // Bước 2: Kiểm tra đã có check-in trong ngày chưa
        var today = DateTimeHelper.GetVietnamNow().Date;
        var existingAttendance = await _attendanceRepository.FirstOrDefaultAsync(
            a => a.EmployeeId == employeeId && a.AttendanceDate == today);
        if (existingAttendance != null)
            return (false, "Bạn đã chấm công vào hôm nay", null);

        // Bước 3: Tìm Location active và kiểm tra GPS Geofence
        Location activeLocation;
        double matchedDistance = 0;
        try
        {
            activeLocation = await _geoLocationService.GetActiveLocationAsync();
            await _geoLocationService.ValidateWithinGeofenceAsync(request.Latitude, request.Longitude);
            matchedDistance = _geoLocationService.CalculateDistanceToActiveLocation(request.Latitude, request.Longitude, activeLocation);
        }
        catch (Microsoft.AspNetCore.Http.BadHttpRequestException ex)
        {
            return (false, ex.Message, null);
        }
        catch (Exception ex)
        {
            return (false, "Không tìm thấy vị trí chấm công active: " + ex.Message, null);
        }

        // Bước 4: Tìm ca làm việc active
        var activeShifts = await _workingHoursRepository.GetActiveShiftsAsync();
        var workingHours = activeShifts.FirstOrDefault();
        if (workingHours == null)
            return (false, "Không tìm thấy ca làm việc active", null);

        // Bước 5: Xác định trạng thái check-in (OnTime / Late)
        var checkInTime = DateTimeHelper.GetVietnamNow();
        var status = DetermineCheckInStatus(checkInTime, workingHours);

        // Bước 6: Tạo bản ghi chấm công
        var attendance = new Attendance
        {
            EmployeeId = employeeId,
            WorkingHourId = workingHours.WorkingHourId,
            LocationId = activeLocation.LocationId,
            AttendanceDate = today,
            CheckInTime = checkInTime,
            CheckInLat = request.Latitude,
            CheckInLong = request.Longitude,
            Status = status,
            Note = request.Note
        };

        await _attendanceRepository.AddAsync(attendance);
        await _attendanceRepository.SaveChangesAsync();

        // Load lại với đầy đủ thông tin để map sang DTO
        var saved = await _attendanceRepository.GetByIdWithDetailsAsync(attendance.AttendanceId);
        var responseDto = _mapper.Map<AttendanceResponseDto>(saved);

        var statusMsg = status == AttendanceStatus.Late
            ? $" (Đi trễ {GetLateMinutes(checkInTime, workingHours)} phút)"
            : " (Đúng giờ)";

        return (true, $"Check-in thành công tại {activeLocation.LocationName} (cách {matchedDistance:F0}m){statusMsg}", responseDto);
    }

    // ── CHECK-OUT ───────────────────────────────────────────────────────────

    /// <summary>
    /// Thực hiện Check-out cho nhân viên.
    /// </summary>
    public async Task<(bool Success, string Message, AttendanceResponseDto? Data)> CheckOutAsync(
        int employeeId, CheckOutRequestDto request)
    {
        // Bước 1: Tìm bản ghi chấm công đang mở trong ngày
        var attendance = await _attendanceRepository.GetOpenAttendanceAsync(employeeId);
        if (attendance == null)
        {
            // Check if already checked out today
            var today = DateTimeHelper.GetVietnamNow().Date;
            var todayRecord = await _attendanceRepository.FirstOrDefaultAsync(
                a => a.EmployeeId == employeeId && a.AttendanceDate == today);
            if (todayRecord != null && todayRecord.CheckOutTime != null)
                return (false, "Bạn đã chấm công ra hôm nay", null);
            return (false, "Bạn chưa chấm công vào", null);
        }

        // Load đầy đủ thông tin để tính toán
        attendance = await _attendanceRepository.GetByIdWithDetailsAsync(attendance.AttendanceId);
        if (attendance == null)
            return (false, "Không tìm thấy bản ghi chấm công", null);

        // Bước 2: Kiểm tra khoảng cách GPS check-out
        try
        {
            await _geoLocationService.ValidateWithinGeofenceAsync(request.Latitude, request.Longitude);
        }
        catch (Microsoft.AspNetCore.Http.BadHttpRequestException ex)
        {
            return (false, ex.Message, null);
        }
        catch (Exception ex)
        {
            return (false, "Lỗi kiểm tra vị trí chấm công: " + ex.Message, null);
        }

        // Bước 3: Cập nhật thông tin check-out
        var checkOutTime = DateTimeHelper.GetVietnamNow();
        attendance.CheckOutTime = checkOutTime;
        attendance.CheckOutLat = request.Latitude;
        attendance.CheckOutLong = request.Longitude;

        // Bước 4: Tính giờ làm thực tế
        var actualHours = (checkOutTime - attendance.CheckInTime).TotalHours;
        attendance.ActualHours = Math.Round(actualHours, 2);

        // Bước 5: Tính overtime dựa trên ca làm việc
        if (attendance.WorkingHours != null)
        {
            var overtimeHours = actualHours - attendance.WorkingHours.ShiftDuration;
            attendance.OvertimeHours = overtimeHours > 0 ? Math.Round(overtimeHours, 2) : 0;
        }

        // Bước 6: Cập nhật trạng thái và ghi chú
        // Không đổi trạng thái OnTime/Late khi check-out
        if (!string.IsNullOrEmpty(request.Note))
            attendance.Note = string.IsNullOrEmpty(attendance.Note)
                ? request.Note
                : attendance.Note + " | " + request.Note;

        _attendanceRepository.Update(attendance);
        await _attendanceRepository.SaveChangesAsync();

        var responseDto = _mapper.Map<AttendanceResponseDto>(attendance);
        return (true,
            $"Check-out thành công. Tổng giờ làm: {attendance.ActualHours:F1}h" +
            (attendance.OvertimeHours > 0 ? $" (Overtime: {attendance.OvertimeHours:F1}h)" : ""),
            responseDto);
    }

    // ── HISTORY / QUERIES ────────────────────────────────────────────────────

    /// <summary>
    /// Lấy lịch sử chấm công của nhân viên (dành cho Employee).
    /// Mặc định lấy 30 ngày gần nhất nếu không truyền ngày.
    /// IsForgotCheckout được tính theo giờ Việt Nam:
    ///   có CheckIn + chưa CheckOut + AttendanceDate đã qua ngày hôm nay.
    /// Status gốc (Late / OnTime) KHÔNG bị ghi đè.
    /// </summary>
    public async Task<IEnumerable<AttendanceResponseDto>> GetMyHistoryAsync(
        int employeeId,
        DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        var from = fromDate ?? DateTimeHelper.GetVietnamNow().AddDays(-30);
        var to = toDate ?? DateTimeHelper.GetVietnamNow();

        var records = await _attendanceRepository.GetHistoryWithDetailsAsync(employeeId, from, to);
        var recordList = records.ToList();

        // Map sang DTO (IsForgotCheckout / DisplayStatus được Ignore trong MappingProfile)
        var dtos = _mapper.Map<List<AttendanceResponseDto>>(recordList);

        // Lấy ngày hiện tại theo giờ Việt Nam một lần duy nhất
        var vietnamNow = DateTimeHelper.GetVietnamNow();

        // Tính IsForgotCheckout và DisplayStatus theo đúng nghiệp vụ:
        // – Phải có giờ vào
        // – Chưa có giờ ra
        // – AttendanceDate đã qua (nhỏ hơn ngày hôm nay tại Việt Nam)
        // Bản ghi của hôm nay chưa check-out KHÔNG được tính là quên check-out.
        for (int i = 0; i < dtos.Count; i++)
        {
            var entity = recordList[i];
            var dto = dtos[i];

            bool isForgotCheckout =
                entity.CheckInTime != default
                && entity.CheckOutTime == null
                && entity.AttendanceDate.Date < vietnamNow.Date;

            dto.IsForgotCheckout = isForgotCheckout;

            // DisplayStatus ưu tiên ForgotCheckout; Status gốc (Late/OnTime) vẫn được giữ
            dto.DisplayStatus = isForgotCheckout
                ? "ForgotCheckout"
                : entity.Status;
        }

        return dtos;
    }

    /// <summary>
    /// Lấy tất cả bản ghi chấm công (dành cho Admin).
    /// Hỗ trợ lọc theo ngày. Mặc định lấy 30 ngày gần nhất.
    /// </summary>
    public async Task<IEnumerable<AttendanceResponseDto>> GetAllAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        var from = fromDate ?? DateTimeHelper.GetVietnamNow().AddDays(-30);
        var to = toDate ?? DateTimeHelper.GetVietnamNow().AddDays(1); // include today

        var records = await _attendanceRepository.GetAllWithDetailsAsync(from, to);
        return _mapper.Map<IEnumerable<AttendanceResponseDto>>(records);
    }

    /// <summary>Lấy lịch sử chấm công của một nhân viên (dành cho Admin)</summary>
    public async Task<IEnumerable<AttendanceResponseDto>> GetByEmployeeAsync(
        int employeeId,
        DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        var from = fromDate ?? DateTimeHelper.GetVietnamNow().AddDays(-30);
        var to = toDate ?? DateTimeHelper.GetVietnamNow();

        var records = await _attendanceRepository.GetHistoryWithDetailsAsync(employeeId, from, to);
        return _mapper.Map<IEnumerable<AttendanceResponseDto>>(records);
    }

    /// <summary>Báo cáo tổng hợp chấm công theo tháng của một nhân viên (dành cho Admin)</summary>
    public async Task<AttendanceReportDto?> GetMonthlyReportAsync(int employeeId, int year, int month)
    {
        var employee = await _employeeRepository.GetByIdWithUserAsync(employeeId);
        if (employee == null) return null;

        var records = await _attendanceRepository.GetMonthlyReportAsync(employeeId, year, month);
        var recordList = records.ToList();

        var dtos = _mapper.Map<List<AttendanceResponseDto>>(recordList);

        return new AttendanceReportDto
        {
            EmployeeId = employeeId,
            EmployeeName = employee.FullName,
            Department = employee.Department,
            TotalPresent = recordList.Count(r => r.Status == AttendanceStatus.OnTime ||
                                                  r.Status == AttendanceStatus.Late ||
                                                  r.Status == AttendanceStatus.CheckedOut),
            TotalLate = recordList.Count(r => r.Status == AttendanceStatus.Late),
            TotalAbsent = 0, // Tính ở tầng cao hơn nếu cần
            TotalActualHours = Math.Round(recordList.Sum(r => r.ActualHours ?? 0), 2),
            TotalOvertimeHours = Math.Round(recordList.Sum(r => r.OvertimeHours ?? 0), 2),
            Records = dtos
        };
    }

    // ── PRIVATE HELPERS ──────────────────────────────────────────────────────

    /// <summary>
    /// Xác định trạng thái check-in: OnTime hoặc Late.
    /// So sánh giờ check-in thực tế với StartTime của ca + Overtime.
    /// </summary>
    private static string DetermineCheckInStatus(DateTime checkInTime, WorkingHours workingHours)
    {
        // Lấy giờ check-in (đã là múi giờ Việt Nam)
        var checkInTimeOfDay = checkInTime.TimeOfDay;

        // Thời điểm được tính là trễ = StartTime + Overtime
        var lateThreshold = workingHours.StartTime
            .Add(TimeSpan.FromMinutes(workingHours.Overtime));

        return checkInTimeOfDay > lateThreshold
            ? AttendanceStatus.Late
            : AttendanceStatus.OnTime;
    }

    /// <summary>Tính số phút trễ so với giờ bắt đầu ca</summary>
    private static int GetLateMinutes(DateTime checkInTime, WorkingHours workingHours)
    {
        var localCheckIn = checkInTime.TimeOfDay;
        var diff = localCheckIn - workingHours.StartTime;
        return diff > TimeSpan.Zero ? (int)diff.TotalMinutes : 0;
    }

    // ── APPROVE FORGOT CHECKOUT ──────────────────────────────────────────────

    /// <summary>
    /// [Admin] Duyệt bản ghi "Quên check-out":
    /// ghi nhận CheckOutTime theo EndTime của ca làm,
    /// tính lại ActualHours / OvertimeHours / Status, cập nhật Note.
    /// </summary>
    public async Task<AttendanceResponseDto> ApproveForgotCheckoutAsync(
        int attendanceId,
        int adminUserId)
    {
        // 1. Lấy giờ Việt Nam hiện tại
        var today = DateTimeHelper.GetVietnamNow().Date;

        // 2. Tìm attendance kèm WorkingHours, Employee, Location
        var attendance = await _attendanceRepository.GetByIdWithDetailsAsync(attendanceId);

        // 3. Validate
        if (attendance == null)
            throw new KeyNotFoundException("Không tìm thấy bản ghi chấm công");

        if (attendance.CheckOutTime != null)
            throw new InvalidOperationException("Bản ghi này đã có giờ ra");

        if (attendance.AttendanceDate.Date >= today)
            throw new InvalidOperationException(
                "Chỉ được duyệt bản ghi quên check-out của những ngày đã qua");

        if (attendance.WorkingHours == null)
            throw new InvalidOperationException(
                "Không tìm thấy ca làm việc của bản ghi chấm công");

        // 4. Tạo CheckOutTime = ngày chấm công + EndTime của ca
        var standardCheckOutTime =
            attendance.AttendanceDate.Date.Add(attendance.WorkingHours.EndTime);

        // 5. Validate giờ ra không được nhỏ hơn hoặc bằng giờ vào
        if (standardCheckOutTime <= attendance.CheckInTime)
            throw new InvalidOperationException(
                "Giờ kết thúc ca không hợp lệ so với giờ vào");

        // 6. Cập nhật CheckOutTime (không gán tọa độ vì đây là Admin duyệt)
        attendance.CheckOutTime = standardCheckOutTime;
        // CheckOutLat / CheckOutLong giữ null – nullable trong entity

        // 7. Tính ActualHours
        var actualHours = (standardCheckOutTime - attendance.CheckInTime).TotalHours;
        attendance.ActualHours = Math.Round(actualHours, 2);

        // 8. Tính OvertimeHours
        // Overtime tính sau khi kết thúc ca + ngưỡng Overtime phút
        var overtimeStartTime =
            attendance.AttendanceDate.Date
                .Add(attendance.WorkingHours.EndTime)
                .AddMinutes(attendance.WorkingHours.Overtime);

        attendance.OvertimeHours = standardCheckOutTime > overtimeStartTime
            ? Math.Round((standardCheckOutTime - overtimeStartTime).TotalHours, 2)
            : 0;

        // 9. Giữ đúng Status (Late / OnTime) – KHÔNG đặt CheckedOut
        //    Nếu status cũ là Late hoặc OnTime thì giữ nguyên.
        //    Nếu vì lý do nào đó status đã bị set khác, khôi phục từ CheckInTime.
        if (attendance.Status != AttendanceStatus.Late &&
            attendance.Status != AttendanceStatus.OnTime)
        {
            var standardStartTime =
                attendance.AttendanceDate.Date.Add(attendance.WorkingHours.StartTime);

            attendance.Status = attendance.CheckInTime > standardStartTime
                ? AttendanceStatus.Late
                : AttendanceStatus.OnTime;
        }

        // 10. Ghi chú
        const string approveNote = "Đã được quản trị viên duyệt giờ ra tiêu chuẩn";
        attendance.Note = string.IsNullOrWhiteSpace(attendance.Note)
            ? approveNote
            : $"{attendance.Note} | {approveNote}";

        // 11. Lưu
        _attendanceRepository.Update(attendance);
        await _attendanceRepository.SaveChangesAsync();

        return _mapper.Map<AttendanceResponseDto>(attendance);
    }
}
