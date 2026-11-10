using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GpsAttendance.API.Data;
using GpsAttendance.API.DTOs.Auth;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace GpsAttendance.API.Services;

/// <summary>
/// AuthService – xử lý đăng nhập, xác thực người dùng và tạo JWT Token.
/// </summary>
public class AuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _db;

    public AuthService(IUserRepository userRepository, IConfiguration configuration, AppDbContext db)
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _db = db;
    }

    /// <summary>
    /// Xác thực đăng nhập và trả về JWT token nếu hợp lệ.
    /// </summary>
    public async Task<LoginAttemptResult> LoginAsync(LoginRequestDto request)
    {
        // 1. Tìm user theo username hoặc số điện thoại
        var identifier = request.Identifier.Trim();
        var user = await _db.Users.Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.IsActive && (u.PhoneNumber == identifier || u.Username == identifier));

        if (user == null || !user.IsActive)
            return LoginAttemptResult.Failed("Sai số điện thoại hoặc mật khẩu");

        // 2. Kiểm tra password bằng BCrypt
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return LoginAttemptResult.Failed("Sai số điện thoại hoặc mật khẩu");

        if (user.Role != "Admin" && string.IsNullOrWhiteSpace(request.DeviceToken))
            return LoginAttemptResult.Failed("Thiết bị đăng nhập không hợp lệ", "DEVICE_REQUIRED");

        if (user.Role != "Admin")
        {
            var deviceHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.DeviceToken!.Trim())));
            if (string.IsNullOrWhiteSpace(user.DeviceTokenHash))
            {
                user.DeviceTokenHash = deviceHash;
                user.DeviceName = request.DeviceName?.Trim();
                user.DevicePlatform = request.DevicePlatform?.Trim();
                user.DeviceBrowser = request.DeviceBrowser?.Trim();
                user.DeviceLastLoginAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            else if (!string.Equals(user.DeviceTokenHash, deviceHash, StringComparison.OrdinalIgnoreCase))
            {
                var pending = await _db.DeviceChangeRequests.AnyAsync(r => r.UserId == user.Id && r.DeviceTokenHash == deviceHash && r.Status == "Pending");
                if (!request.RequestDeviceApproval)
                    return LoginAttemptResult.Failed(
                        "Bạn đang đăng nhập bằng thiết bị mới. Bạn có đồng ý gửi yêu cầu xét duyệt đến quản trị viên không?",
                        "DEVICE_APPROVAL_CONFIRMATION_REQUIRED");

                if (!pending)
                {
                    _db.DeviceChangeRequests.Add(new DeviceChangeRequest
                    {
                        UserId = user.Id, DeviceTokenHash = deviceHash,
                        DeviceName = request.DeviceName?.Trim(), DevicePlatform = request.DevicePlatform?.Trim(),
                        DeviceBrowser = request.DeviceBrowser?.Trim(), Status = "Pending", RequestedAt = DateTime.UtcNow
                    });
                    await _db.SaveChangesAsync();
                }
                return LoginAttemptResult.Failed(
                    "Yêu cầu xét duyệt thiết bị đã được gửi thành công.",
                    "DEVICE_APPROVAL_SENT");
            }
            else
            {
                user.DeviceLastLoginAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        // 3. Tạo JWT Token
        var (token, expiresAt) = GenerateJwtToken(user);

        // 4. Xây dựng response
        return LoginAttemptResult.Success(new LoginResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            UserInfo = new UserInfoDto
            {
                UserId = user.Id,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                EmployeeId = user.Employee?.EmployeeId,
                EmployeeCode = user.Employee?.EmployeeCode,
                FullName = user.Employee?.FullName,
                Email = user.Employee?.Email
            }
        });
    }

    /// <summary>
    /// Tạo JWT Token với các Claims bao gồm UserId, Username, Email, Role và EmployeeId.
    /// Token được ký bằng HMAC-SHA256 với secret key trong appsettings.
    /// </summary>
    private (string Token, DateTime ExpiresAt) GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]
            ?? throw new InvalidOperationException("JWT SecretKey chưa được cấu hình");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expirationHours = int.TryParse(jwtSettings["ExpirationHours"], out var h) ? h : 24;
        var expiresAt = DateTime.UtcNow.AddHours(expirationHours);

        // Danh sách Claims – bao gồm Role để [Authorize(Roles="...")] hoạt động
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.PhoneNumber),
            new Claim(ClaimTypes.Role, user.Role),          // ← quan trọng cho [Authorize(Roles)]
            new Claim("userId", user.Id.ToString()),
            new Claim("employeeId", user.Employee?.EmployeeId.ToString() ?? ""),
            new Claim("role", user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    /// <summary>Hash password bằng BCrypt trước khi lưu vào database.</summary>
    public static string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);

    /// <summary>Xác minh password người dùng nhập với hash trong database</summary>
    public static bool VerifyPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}

public sealed record LoginAttemptResult(LoginResponseDto? Response, string Message, string? Code)
{
    public bool IsSuccess => Response != null;
    public static LoginAttemptResult Success(LoginResponseDto response) => new(response, "Đăng nhập thành công", null);
    public static LoginAttemptResult Failed(string message, string? code = null) => new(null, message, code);
}

