using AutoMapper;
using GpsAttendance.API.DTOs.Common;
using GpsAttendance.API.DTOs.Employee;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using GpsAttendance.API.Data;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Services;

/// <summary>
/// EmployeeService – xử lý nghiệp vụ quản lý nhân viên.
/// </summary>
public class EmployeeService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUserRepository _userRepository;
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<EmployeeService> _logger;

    public EmployeeService(
        IEmployeeRepository employeeRepository,
        IUserRepository userRepository,
        AppDbContext dbContext,
        IMapper mapper,
        ILogger<EmployeeService> logger)
    {
        _employeeRepository = employeeRepository;
        _userRepository = userRepository;
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>Lấy danh sách nhân viên có phân trang và tìm kiếm</summary>
    public async Task<PagedResultDto<EmployeeDto>> GetPagedAsync(
        int page, int pageSize, string? department = null, string? keyword = null)
    {
        var (items, totalCount) = await _employeeRepository.GetPagedAsync(page, pageSize, department, keyword);
        var dtos = _mapper.Map<IEnumerable<EmployeeDto>>(items);

        return new PagedResultDto<EmployeeDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>Lấy thông tin một nhân viên theo ID</summary>
    public async Task<EmployeeDto?> GetByIdAsync(int id)
    {
        var employee = await _employeeRepository.GetByIdWithUserAsync(id);
        return employee == null ? null : _mapper.Map<EmployeeDto>(employee);
    }

    /// <summary>Lấy thông tin nhân viên theo UserId (dùng cho profile của chính mình)</summary>
    public async Task<EmployeeDto?> GetByUserIdAsync(int userId)
    {
        var employee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == userId);
        if (employee == null) return null;
        var fullEmployee = await _employeeRepository.GetByIdWithUserAsync(employee.EmployeeId);
        return fullEmployee == null ? null : _mapper.Map<EmployeeDto>(fullEmployee);
    }

    /// <summary>Tạo nhân viên mới kèm tài khoản đăng nhập</summary>
    public async Task<(bool Success, string Message, EmployeeDto? Data)> CreateAsync(CreateEmployeeDto request)
    {
        // Kiểm tra PhoneNumber
        if (await _dbContext.Users.AnyAsync(u => u.PhoneNumber == request.PhoneNumber))
            return (false, "Số điện thoại đã được sử dụng", null);

        var strategy = _dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                // Hash password
                var passwordHash = AuthService.HashPassword(request.Password);

                // Tạo User account
                var user = new User
                {
                    PhoneNumber = request.PhoneNumber,
                    PasswordHash = passwordHash,
                    Role = request.Role,
                    IsActive = true
                };
                
                _dbContext.Users.Add(user);
                await _dbContext.SaveChangesAsync();

                // Sinh EmployeeCode
                string nextCode = "QH01";
                var maxEmployee = await _dbContext.Employees
                    .Where(e => e.EmployeeCode.StartsWith("QH"))
                    .OrderByDescending(e => e.EmployeeCode)
                    .FirstOrDefaultAsync();

                if (maxEmployee != null && maxEmployee.EmployeeCode.Length > 2)
                {
                    if (int.TryParse(maxEmployee.EmployeeCode.Substring(2), out int currentMax))
                    {
                        nextCode = $"QH{(currentMax + 1):D2}";
                    }
                }

                // Tạo Employee profile
                var employee = _mapper.Map<Employee>(request);
                employee.UserId = user.Id;
                employee.EmployeeCode = nextCode;
                employee.EmployeeStatus = "Active";
                
                _dbContext.Employees.Add(employee);
                await _dbContext.SaveChangesAsync();

                await transaction.CommitAsync();

                var created = await _employeeRepository.GetByIdWithUserAsync(employee.EmployeeId);
                var dto = _mapper.Map<EmployeeDto>(created);

                _logger.LogInformation("Tạo nhân viên mới: {FullName} (Code: {Code})", employee.FullName, employee.EmployeeCode);
                return (true, "Tạo nhân viên thành công", dto)!;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi khi tạo nhân viên");
                return (false, "Lỗi hệ thống khi tạo nhân viên", (EmployeeDto?)null);
            }
        });
    }

    public async Task<(bool Success, string Message, EmployeeDto? Data)> UpdateAsync(int id, UpdateEmployeeDto request)
    {
        var employee = await _employeeRepository.GetByIdWithUserAsync(id);
        if (employee == null)
            return (false, $"Không tìm thấy nhân viên ID: {id}", null);

        // Trim input properties
        if (request.FullName != null) request.FullName = request.FullName.Trim();
        if (request.Email != null) request.Email = request.Email.Trim();
        if (request.PhoneNumber != null) request.PhoneNumber = request.PhoneNumber.Trim();

        _mapper.Map(request, employee);
        
        // Handle User info updates if passed
        if (!string.IsNullOrEmpty(request.PhoneNumber) && employee.User != null)
        {
            // check unique
            if (await _dbContext.Users.AnyAsync(u => u.PhoneNumber == request.PhoneNumber && u.Id != employee.UserId))
                return (false, "Số điện thoại đã được sử dụng", null);
                
            employee.User.PhoneNumber = request.PhoneNumber;
        }
        if (!string.IsNullOrEmpty(request.Role) && employee.User != null)
        {
            employee.User.Role = request.Role;
        }
        if (request.IsActive.HasValue && employee.User != null)
        {
            employee.User.IsActive = request.IsActive.Value;
        }
        if (!string.IsNullOrWhiteSpace(request.Password) && employee.User != null)
        {
            employee.User.PasswordHash = AuthService.HashPassword(request.Password);
        }
        
        _employeeRepository.Update(employee);
        await _employeeRepository.SaveChangesAsync();

        var dto = _mapper.Map<EmployeeDto>(employee);
        return (true, "Cập nhật nhân viên thành công", dto);
    }

    /// <summary>Vô hiệu hóa tài khoản nhân viên (soft delete)</summary>
    public async Task<(bool Success, string Message)> DeleteAsync(int id)
    {
        var employee = await _employeeRepository.GetByIdWithUserAsync(id);
        if (employee == null)
            return (false, $"Không tìm thấy nhân viên ID: {id}");

        if (employee.User != null)
        {
            employee.User.IsActive = false;
            _userRepository.Update(employee.User);
            await _userRepository.SaveChangesAsync();
        }

        _logger.LogInformation("Vô hiệu hóa nhân viên: {FullName} (ID: {Id})", employee.FullName, id);
        return (true, $"Đã vô hiệu hóa nhân viên {employee.FullName}");
    }
}
