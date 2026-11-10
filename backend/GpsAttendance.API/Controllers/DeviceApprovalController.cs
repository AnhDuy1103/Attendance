using System.Security.Claims;
using GpsAttendance.API.Data;
using GpsAttendance.API.DTOs.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GpsAttendance.API.Controllers;

[ApiController]
[Route("api/admin/device-requests")]
[Authorize(Roles = "Admin")]
public class DeviceApprovalController : ControllerBase
{
    private readonly AppDbContext _db;

    public DeviceApprovalController(AppDbContext db) => _db = db;

    private int? CurrentAdminId()
    {
        var value = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<IActionResult> GetPending()
    {
        var requests = await _db.DeviceChangeRequests
            .Include(r => r.User).ThenInclude(u => u.Employee)
            .Where(r => r.Status == "Pending")
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => new
            {
                r.RequestId,
                r.UserId,
                PhoneNumber = r.User.PhoneNumber,
                FullName = r.User.Employee != null ? r.User.Employee.FullName : "Quản trị viên",
                r.DeviceName,
                r.DevicePlatform,
                r.DeviceBrowser,
                r.IpAddress,
                r.Status,
                r.RequestedAt
            }).ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(requests, "Lấy danh sách yêu cầu thiết bị thành công"));
    }

    [HttpPut("{requestId:int}/approve")]
    public async Task<IActionResult> Approve(int requestId)
    {
        var adminId = CurrentAdminId();
        var request = await _db.DeviceChangeRequests.FirstOrDefaultAsync(r => r.RequestId == requestId);
        if (request == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy yêu cầu thiết bị"));
        if (request.Status != "Pending") return BadRequest(ApiResponseDto<object>.Fail("Yêu cầu đã được xử lý"));

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user == null || !user.IsActive) return NotFound(ApiResponseDto<object>.Fail("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa"));

        user.DeviceTokenHash = request.DeviceTokenHash;
        user.DeviceName = request.DeviceName;
        user.DevicePlatform = request.DevicePlatform;
        user.DeviceBrowser = request.DeviceBrowser;
        user.DeviceLastLoginAt = DateTime.UtcNow;
        request.Status = "Approved";
        request.ProcessedAt = DateTime.UtcNow;
        request.ProcessedBy = adminId;
        await _db.SaveChangesAsync();

        return Ok(ApiResponseDto<object>.Ok(null!, "Đã duyệt thiết bị. Thiết bị cũ đã bị thay thế."));
    }

    [HttpPut("{requestId:int}/reject")]
    public async Task<IActionResult> Reject(int requestId, [FromBody] RejectDeviceRequest? body)
    {
        var request = await _db.DeviceChangeRequests.FirstOrDefaultAsync(r => r.RequestId == requestId);
        if (request == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy yêu cầu thiết bị"));
        if (request.Status != "Pending") return BadRequest(ApiResponseDto<object>.Fail("Yêu cầu đã được xử lý"));

        request.Status = "Rejected";
        request.ProcessedAt = DateTime.UtcNow;
        request.ProcessedBy = CurrentAdminId();
        request.Note = body?.Note;
        await _db.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(null!, "Đã từ chối thiết bị"));
    }

    public sealed class RejectDeviceRequest
    {
        public string? Note { get; set; }
    }
}
