using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GpsAttendance.API.DTOs.Auth;
using GpsAttendance.API.Models;
using GpsAttendance.API.Repositories.Interfaces;
using Microsoft.IdentityModel.Tokens;

namespace GpsAttendance.API.Services;

/// <summary>
/// AuthService – xử lý đăng nhập, xác thực người dùng và tạo JWT Token.
/// </summary>
public class AuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    /// <summary>
    /// Xác thực đăng nhập và trả về JWT token nếu hợp lệ.
    /// </summary>
    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        // 1. Tìm user theo PhoneNumber
        var user = await _userRepository.GetByIdWithEmployeeAsync(
            (await _userRepository.GetByPhoneNumberAsync(request.PhoneNumber))?.Id ?? 0);

        if (user == null || !user.IsActive)
            return null;

        // 2. Kiểm tra password bằng BCrypt
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        // 3. Tạo JWT Token
        var (token, expiresAt) = GenerateJwtToken(user);

        // 4. Xây dựng response
        return new LoginResponseDto
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
        };
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
