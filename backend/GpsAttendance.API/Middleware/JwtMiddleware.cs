using System.Net;
using System.Text.Json;

namespace GpsAttendance.API.Middleware;

/// <summary>
/// JwtMiddleware – Middleware xử lý lỗi JWT và các exception toàn hệ thống.
/// Bắt tất cả exception chưa được xử lý và trả về response JSON chuẩn.
/// Đặt ở đầu pipeline để bắt mọi lỗi.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Truy cập bị từ chối: {Path}", context.Request.Path);
            await WriteErrorResponseAsync(context, HttpStatusCode.Unauthorized,
                "Bạn không có quyền truy cập vào tài nguyên này");
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Không tìm thấy tài nguyên: {Path}", context.Request.Path);
            await WriteErrorResponseAsync(context, HttpStatusCode.NotFound,
                ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Tham số không hợp lệ: {Path}", context.Request.Path);
            await WriteErrorResponseAsync(context, HttpStatusCode.BadRequest,
                ex.Message);
        }
        catch (Exception ex)
        {
            // Log đầy đủ stack trace cho lỗi không xác định
            _logger.LogError(ex,
                "Lỗi không xác định tại {Method} {Path}",
                context.Request.Method,
                context.Request.Path);

            await WriteErrorResponseAsync(context, HttpStatusCode.InternalServerError,
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
        }
    }

    /// <summary>Ghi response lỗi theo định dạng JSON chuẩn</summary>
    private static async Task WriteErrorResponseAsync(
        HttpContext context,
        HttpStatusCode statusCode,
        string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            Success = false,
            StatusCode = (int)statusCode,
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

/// <summary>Extension method để đăng ký middleware vào pipeline</summary>
public static class ExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionMiddleware(this IApplicationBuilder app)
        => app.UseMiddleware<ExceptionMiddleware>();
}
