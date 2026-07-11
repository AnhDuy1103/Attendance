using AutoMapper;
using GpsAttendance.API.DTOs.Auth;
using GpsAttendance.API.DTOs.Attendance;
using GpsAttendance.API.DTOs.Employee;
using GpsAttendance.API.DTOs.Location;
using GpsAttendance.API.DTOs.WorkingHours;
using GpsAttendance.API.Models;

namespace GpsAttendance.API.Mappings;

/// <summary>
/// MappingProfile – cấu hình AutoMapper để ánh xạ giữa Entity Models và DTOs.
/// Tất cả mapping được khai báo tập trung tại đây.
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ── User Mappings ─────────────────────────────────────────────────────

        CreateMap<User, UserInfoDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.EmployeeId,
                opt => opt.MapFrom(src => src.Employee != null ? src.Employee.EmployeeId : (int?)null))
            .ForMember(dest => dest.EmployeeCode,
                opt => opt.MapFrom(src => src.Employee != null ? src.Employee.EmployeeCode : null))
            .ForMember(dest => dest.Email,
                opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Email : null))
            .ForMember(dest => dest.FullName,
                opt => opt.MapFrom(src => src.Employee != null ? src.Employee.FullName : null));

        // ── Employee Mappings ─────────────────────────────────────────────────

        CreateMap<Employee, EmployeeDto>()
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.User.PhoneNumber))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.User.Role))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.User.IsActive));

        CreateMap<CreateEmployeeDto, Employee>()
            .ForMember(dest => dest.EmployeeId, opt => opt.Ignore())
            .ForMember(dest => dest.EmployeeCode, opt => opt.Ignore())
            .ForMember(dest => dest.EmployeeStatus, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Attendances, opt => opt.Ignore())
            .ForSourceMember(src => src.PhoneNumber, opt => opt.DoNotValidate())
            .ForSourceMember(src => src.Role, opt => opt.DoNotValidate())
            .ForSourceMember(src => src.Password, opt => opt.DoNotValidate());

        CreateMap<UpdateEmployeeDto, Employee>()
            .ForMember(dest => dest.EmployeeId, opt => opt.Ignore())
            .ForMember(dest => dest.EmployeeCode, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Attendances, opt => opt.Ignore())
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // ── Attendance Mappings ───────────────────────────────────────────────

        CreateMap<Attendance, AttendanceResponseDto>()
            .ForMember(dest => dest.EmployeeName,
                opt => opt.MapFrom(src => src.Employee != null ? src.Employee.FullName : string.Empty))
            .ForMember(dest => dest.EmployeeCode,
                opt => opt.MapFrom(src => src.Employee != null ? src.Employee.EmployeeCode : string.Empty))
            .ForMember(dest => dest.Department,
                opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Department : string.Empty))
            .ForMember(dest => dest.LocationName,
                opt => opt.MapFrom(src => src.Location != null ? src.Location.LocationName : string.Empty));

        // ── Location Mappings ─────────────────────────────────────────────────

        CreateMap<Location, LocationDto>().ReverseMap();
        CreateMap<CreateLocationDto, Location>()
            .ForMember(dest => dest.LocationId, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.Attendances, opt => opt.Ignore());

        // ── WorkingHours Mappings ─────────────────────────────────────────────

        CreateMap<WorkingHours, WorkingHoursDto>().ReverseMap();
        CreateMap<CreateWorkingHoursDto, WorkingHours>()
            .ForMember(dest => dest.WorkingHourId, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.Attendances, opt => opt.Ignore());
    }
}
