using GpsAttendance.API.Data;
using GpsAttendance.API.Models;
using GpsAttendance.API.Services;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<AppDbContext>();

        // 1. Admin User
        var adminPhone = "0900000000";
        if (!await context.Users.AnyAsync(u => u.PhoneNumber == adminPhone))
        {
            var adminUser = new User
            {
                PhoneNumber = adminPhone,
                PasswordHash = AuthService.HashPassword("123456"),
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();
        }

        // 2. Employee User & 3. Employee Profile
        var employeePhone = "0987654321";
        if (!await context.Users.AnyAsync(u => u.PhoneNumber == employeePhone))
        {
            var employeeUser = new User
            {
                PhoneNumber = employeePhone,
                PasswordHash = AuthService.HashPassword("123456"),
                Role = "Employee",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(employeeUser);
            await context.SaveChangesAsync();

            var employeeCode = "QH01";
            if (!await context.Employees.AnyAsync(e => e.EmployeeCode == employeeCode))
            {
                var employeeProfile = new Employee
                {
                    UserId = employeeUser.Id,
                    EmployeeCode = employeeCode,
                    FullName = "Nguyễn Văn An",
                    Email = "an.nguyen@quanghoa.vn",
                    Department = "Phòng sản xuất",
                    Position = "Nhân viên",
                    JoinDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    EmployeeStatus = "Active"
                };
                context.Employees.Add(employeeProfile);
                await context.SaveChangesAsync();
            }
        }

        // 4. Location
        var locationName = "Công ty Quang Hoa";
        if (!await context.Locations.AnyAsync(l => l.LocationName == locationName))
        {
            var location = new Location
            {
                LocationName = locationName,
                Address = "Cụm công nghiệp Tây An, Duy Xuyên, Đà Nẵng",
                Latitude = 15.879440,
                Longitude = 108.335000,
                Radius = 100,
                IsActive = true
            };
            context.Locations.Add(location);
            await context.SaveChangesAsync();
        }

        // 5. WorkingHours
        var startTime = new TimeSpan(8, 0, 0);
        var endTime = new TimeSpan(17, 0, 0);
        if (!await context.WorkingHours.AnyAsync(w => w.IsActive && w.StartTime == startTime && w.EndTime == endTime))
        {
            var workingHours = new WorkingHours
            {
                StartTime = startTime,
                EndTime = endTime,
                ShiftDuration = 8,
                Overtime = 30,
                IsActive = true
            };
            context.WorkingHours.Add(workingHours);
            await context.SaveChangesAsync();
        }
    }
}
