using System.Text;
using GpsAttendance.API.Data;
using GpsAttendance.API.Mappings;
using GpsAttendance.API.Middleware;
using GpsAttendance.API.Repositories;
using GpsAttendance.API.Repositories.Interfaces;
using GpsAttendance.API.Services;
using GpsAttendance.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ════════════════════════════════════════════════════════════════════════════
// 1. DATABASE – Entity Framework Core với SQL Server
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            sqlOptions.CommandTimeout(30);
        });

    if (builder.Environment.IsDevelopment())
        options.EnableSensitiveDataLogging();
});

// ════════════════════════════════════════════════════════════════════════════
// 2. JWT AUTHENTICATION
// ════════════════════════════════════════════════════════════════════════════
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException("JWT SecretKey chưa được cấu hình trong appsettings.json");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("JWT Authentication thất bại: {Error}", context.Exception.Message);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogDebug("Token hợp lệ cho user: {User}", context.Principal?.Identity?.Name);
            return Task.CompletedTask;
        }
    };
});

// ════════════════════════════════════════════════════════════════════════════
// 3. AUTHORIZATION
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("EmployeeOrAdmin", policy => policy.RequireRole("Employee", "Admin"));
});

// ════════════════════════════════════════════════════════════════════════════
// 4. REPOSITORIES – Đăng ký theo Scoped (mỗi HTTP request 1 instance)
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();
builder.Services.AddScoped<ILocationRepository, LocationRepository>();
builder.Services.AddScoped<IWorkingHoursRepository, WorkingHoursRepository>();

// ════════════════════════════════════════════════════════════════════════════
// 5. SERVICES – Business Logic
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<EmployeeService>();
builder.Services.AddScoped<LocationService>();
builder.Services.AddScoped<WorkingHoursService>();
builder.Services.AddSingleton<HaversineService>(); // Stateless, dùng Singleton
builder.Services.AddHttpClient();
builder.Services.AddScoped<IGeoLocationService, GeoLocationService>();
builder.Services.AddScoped<IGooglePlacesService, GooglePlacesService>();

// ════════════════════════════════════════════════════════════════════════════
// 6. AUTOMAPPER – Đổi sang namespace Mappings
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddAutoMapper(typeof(MappingProfile));

// ════════════════════════════════════════════════════════════════════════════
// 7. CORS – Cho phép Flutter/Web app gọi API
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFlutterApp", policy =>
    {
        policy
            .AllowAnyOrigin()    // Production: thay bằng .WithOrigins("https://yourdomain.com")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. CONTROLLERS + JSON
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// ════════════════════════════════════════════════════════════════════════════
// 9. SWAGGER / OpenAPI với Bearer Token Support
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GPS Attendance API",
        Version = "v1",
        Description = "Hệ thống chấm công nhân viên bằng GPS – ASP.NET Core 8",
        Contact = new OpenApiContact
        {
            Name = "GPS Attendance Team",
            Email = "admin@gpsattendance.com"
        }
    });

    // Bearer token authentication trong Swagger UI
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT token theo định dạng: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);
});

// ════════════════════════════════════════════════════════════════════════════
// 10. LOGGING
// ════════════════════════════════════════════════════════════════════════════
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// ════════════════════════════════════════════════════════════════════════════
// BUILD APPLICATION
// ════════════════════════════════════════════════════════════════════════════
var app = builder.Build();

app.Logger.LogInformation(
    "ASPNETCORE_ENVIRONMENT = {Environment}",
    app.Environment.EnvironmentName
);

// Tự động chạy migration khi khởi động (chỉ nên dùng trong Development)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        dbContext.Database.Migrate();
        app.Logger.LogInformation("Migration áp dụng thành công.");

        // Chạy seed data mẫu
        await DbSeeder.SeedAsync(scope.ServiceProvider);
        app.Logger.LogInformation("Dữ liệu mẫu đã được kiểm tra/seed thành công.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Lỗi khi chạy migration.");
    }
}

// ── Middleware Pipeline ──────────────────────────────────────────────────────

// Global Exception Handler – phải đặt đầu tiên
app.UseExceptionMiddleware();

// Swagger chỉ bật ở Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "GPS Attendance API v1");
        c.RoutePrefix = string.Empty; // Swagger tại root "/"
        c.DisplayRequestDuration();
    });
}

app.UseCors("AllowFlutterApp");     // CORS trước Authentication
app.UseHttpsRedirection();
app.UseAuthentication();            // Xác thực JWT
app.UseAuthorization();             // Phân quyền Role
app.MapControllers();

app.Run();
