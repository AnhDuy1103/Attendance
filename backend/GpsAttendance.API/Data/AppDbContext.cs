using GpsAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Data;

/// <summary>
/// AppDbContext là cầu nối giữa ứng dụng và cơ sở dữ liệu SQL Server.
/// Cấu hình tất cả DbSet và quan hệ giữa các bảng thông qua Fluent API.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ── DbSet – Ánh xạ các class Model tới các bảng trong database ────────────
    public DbSet<User> Users { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<WorkingHours> WorkingHours { get; set; }

    /// <summary>
    /// Cấu hình quan hệ giữa các bảng và các ràng buộc dữ liệu bằng Fluent API.
    /// Fluent API có độ ưu tiên cao hơn Data Annotations.
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Cấu hình bảng User ────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(u => u.Id);

            // PhoneNumber phải duy nhất
            entity.HasIndex(u => u.PhoneNumber).IsUnique();

            entity.Property(u => u.PhoneNumber).HasMaxLength(20).IsRequired();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.Role).HasMaxLength(20).HasDefaultValue("Employee");
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(u => u.IsActive).HasDefaultValue(true);
        });

        // ── Cấu hình bảng Employee ────────────────────────────────────────────
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.ToTable("Employees");
            entity.HasKey(e => e.EmployeeId);

            // EmployeeCode phải duy nhất
            entity.HasIndex(e => e.EmployeeCode).IsUnique();

            entity.Property(e => e.EmployeeCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.Position).HasMaxLength(100);
            entity.Property(e => e.EmployeeStatus).HasMaxLength(50).HasDefaultValue("Active");

            // Quan hệ 1-1: User có một Employee (cascade delete)
            entity.HasOne(e => e.User)
                  .WithOne(u => u.Employee)
                  .HasForeignKey<Employee>(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Cấu hình bảng Location ────────────────────────────────────────────
        modelBuilder.Entity<Location>(entity =>
        {
            entity.ToTable("Locations");
            entity.HasKey(l => l.LocationId);

            entity.Property(l => l.LocationName).HasMaxLength(200).IsRequired();
            entity.Property(l => l.Latitude).HasColumnType("float");
            entity.Property(l => l.Longitude).HasColumnType("float");
            entity.Property(l => l.Radius).HasColumnType("float").HasDefaultValue(100.0);
            entity.Property(l => l.Address).HasMaxLength(500);
            entity.Property(l => l.IsActive).HasDefaultValue(true);
        });

        // ── Cấu hình bảng WorkingHours ────────────────────────────────────────
        modelBuilder.Entity<WorkingHours>(entity =>
        {
            entity.ToTable("WorkingHours");
            entity.HasKey(w => w.WorkingHourId);

            entity.Property(w => w.StartTime).HasColumnType("time");
            entity.Property(w => w.EndTime).HasColumnType("time");
            entity.Property(w => w.ShiftDuration).HasColumnType("float");
            entity.Property(w => w.Overtime).HasDefaultValue(30);
            entity.Property(w => w.IsActive).HasDefaultValue(true);
        });

        // ── Cấu hình bảng Attendance ─────────────────────────────────────────
        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.ToTable("Attendances");
            entity.HasKey(a => a.AttendanceId);

            entity.Property(a => a.AttendanceDate).HasColumnType("date").IsRequired();
            entity.Property(a => a.CheckInTime).HasColumnType("datetime2").IsRequired();
            entity.Property(a => a.CheckOutTime).HasColumnType("datetime2").IsRequired(false);
            entity.Property(a => a.CheckInLat).HasColumnType("float");
            entity.Property(a => a.CheckInLong).HasColumnType("float");
            entity.Property(a => a.CheckOutLat).HasColumnType("float");
            entity.Property(a => a.CheckOutLong).HasColumnType("float");
            entity.Property(a => a.ActualHours).HasColumnType("float").IsRequired(false);
            entity.Property(a => a.OvertimeHours).HasColumnType("float").HasDefaultValue(0.0);
            entity.Property(a => a.Status).HasMaxLength(20).HasDefaultValue("Present");
            entity.Property(a => a.Note).HasMaxLength(500);

            // Quan hệ nhiều-1: Employee có nhiều Attendance (Restrict để tránh cascade)
            entity.HasOne(a => a.Employee)
                  .WithMany(e => e.Attendances)
                  .HasForeignKey(a => a.EmployeeId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Quan hệ nhiều-1: WorkingHours có nhiều Attendance
            entity.HasOne(a => a.WorkingHours)
                  .WithMany(w => w.Attendances)
                  .HasForeignKey(a => a.WorkingHourId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Quan hệ nhiều-1: Location có nhiều Attendance
            entity.HasOne(a => a.Location)
                  .WithMany(l => l.Attendances)
                  .HasForeignKey(a => a.LocationId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Index hỗ trợ tìm kiếm nhanh theo nhân viên + ngày
            entity.HasIndex(a => new { a.EmployeeId, a.CheckInTime });
        });

        // ── Seed Data – Dữ liệu mặc định khi migrate ─────────────────────────
        SeedData(modelBuilder);
    }

    /// <summary>
    /// Tạo dữ liệu mặc định khi chạy migration lần đầu:
    /// - 1 tài khoản Admin
    /// - 1 Location mặc định
    /// - 1 Ca làm việc mặc định
    /// </summary>
    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Seed user Admin (password: Admin@123)
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            PhoneNumber = "0123456789",
            // BCrypt hash của "Admin@123" – đã xác minh Verify = true
            PasswordHash = "$2a$11$FyJOZhFASY.t4rIa/Kc8e.XwdLlx18yHc7Ysy/TPOCP8RBKuLH5He",
            Role = "Admin",
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            IsActive = true
        });

        // Seed Location mặc định
        modelBuilder.Entity<Location>().HasData(new Location
        {
            LocationId = 1,
            LocationName = "Văn phòng chính",
            Latitude = 21.0278,   // Hà Nội
            Longitude = 105.8342,
            Radius = 100,
            Address = "Địa điểm chấm công mặc định tại văn phòng chính",
            IsActive = true
        });

        // Seed ca làm việc Hành chính
        modelBuilder.Entity<WorkingHours>().HasData(new WorkingHours
        {
            WorkingHourId = 1,
            StartTime = new TimeSpan(8, 0, 0),   // 08:00
            EndTime = new TimeSpan(17, 30, 0),   // 17:30
            ShiftDuration = 8,
            Overtime = 30,
            IsActive = true
        });
    }
}
