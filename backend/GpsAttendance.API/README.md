# GPS Attendance API

Hệ thống chấm công nhân viên bằng GPS – Backend ASP.NET Core 8

## Công nghệ

| Layer | Tech |
|-------|------|
| Framework | ASP.NET Core 8 Web API |
| ORM | Entity Framework Core 8 (Code First) |
| Database | SQL Server |
| Auth | JWT Bearer (HMAC-SHA256) |
| Mapping | AutoMapper |
| Password | BCrypt.Net |
| Docs | Swagger / OpenAPI |

## Cấu trúc thư mục

```
GpsAttendance.API/
├── Controllers/          # HTTP endpoints
│   ├── AuthController.cs
│   ├── AttendanceController.cs
│   ├── EmployeeController.cs
│   ├── LocationController.cs
│   └── WorkingHoursController.cs
├── Models/               # Entity classes (Code First)
│   ├── User.cs
│   ├── Employee.cs
│   ├── Attendance.cs
│   ├── Location.cs
│   └── WorkingHours.cs
├── DTOs/                 # Data Transfer Objects
│   └── AppDtos.cs        (tất cả DTOs gộp vào 1 file)
├── Data/
│   └── AppDbContext.cs   # DbContext + Fluent API + Seed Data
├── Repositories/
│   ├── Interfaces/       # IGenericRepository + domain interfaces
│   ├── GenericRepository.cs
│   ├── UserRepository.cs
│   ├── EmployeeRepository.cs
│   ├── AttendanceRepository.cs
│   └── LocationRepository.cs
├── Services/
│   ├── AuthService.cs        # JWT generation, BCrypt verify
│   ├── AttendanceService.cs  # CheckIn/Out + GPS validation
│   └── HaversineService.cs   # GPS distance formula
├── Helpers/
│   └── MappingProfile.cs     # AutoMapper configuration
├── Middleware/
│   └── JwtMiddleware.cs      # Global exception handler
├── appsettings.json
└── Program.cs                # DI, JWT, Swagger, CORS, EF
```

## Cài đặt & Chạy

### 1. Yêu cầu hệ thống
- .NET 8 SDK
- SQL Server (hoặc SQL Server Express / LocalDB)

### 2. Cấu hình Database

Chỉnh sửa `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=GpsAttendanceDb;User Id=sa;Password=YourPassword!;TrustServerCertificate=True;"
}
```

### 3. Cài đặt packages
```bash
dotnet restore
```

### 4. Tạo Migration & Database
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 5. Chạy API
```bash
dotnet run
```

API sẽ chạy tại: `https://localhost:5001`  
Swagger UI: `https://localhost:5001/` (root)

## API Endpoints

### Authentication
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/login` | Đăng nhập, lấy JWT | Public |
| POST | `/api/auth/logout` | Đăng xuất | Public |

### Attendance (Chấm công)
| Method | Endpoint | Mô tả | Role |
|--------|----------|-------|------|
| POST | `/api/attendance/checkin` | Check-in GPS | Employee, Admin |
| POST | `/api/attendance/checkout` | Check-out | Employee, Admin |
| GET | `/api/attendance/history` | Lịch sử chấm công | Employee, Admin |
| GET | `/api/attendance/today` | Chấm công hôm nay | Admin |

### Employees
| Method | Endpoint | Mô tả | Role |
|--------|----------|-------|------|
| GET | `/api/employees` | Danh sách (phân trang) | Admin |
| GET | `/api/employees/{id}` | Chi tiết nhân viên | Admin |
| POST | `/api/employees` | Tạo nhân viên mới | Admin |
| PUT | `/api/employees/{id}` | Cập nhật | Admin |
| DELETE | `/api/employees/{id}` | Vô hiệu hoá | Admin |

### Locations
| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/api/locations` | All |
| GET | `/api/locations/{id}` | All |
| POST | `/api/locations` | Admin |
| PUT | `/api/locations/{id}` | Admin |
| DELETE | `/api/locations/{id}` | Admin |

### Working Hours
| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/api/workinghours` | All |
| GET | `/api/workinghours/{id}` | All |
| POST | `/api/workinghours` | Admin |
| PUT | `/api/workinghours/{id}` | Admin |
| DELETE | `/api/workinghours/{id}` | Admin |

## Tài khoản mặc định (Seed Data)

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | Admin |

## GPS – Công thức Haversine

```
d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)))
```

- R = 6,371,000 m (bán kính Trái Đất)
- Nếu `d ≤ radius` → Cho phép chấm công
- Nếu `d > radius` → Từ chối, trả lỗi kèm khoảng cách thực tế

## JWT Token Structure

```
Header: { alg: HS256, typ: JWT }
Payload: {
  sub: userId,
  unique_name: username,
  email: email,
  role: "Admin" | "Employee",
  userId: ...,
  employeeId: ...,
  exp: timestamp
}
```
