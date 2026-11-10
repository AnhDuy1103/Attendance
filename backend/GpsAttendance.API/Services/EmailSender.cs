using System.Net;
using System.Net.Mail;

namespace GpsAttendance.API.Services;

public sealed class EmailSettings
{
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string DisplayName { get; set; } = "GPS Attendance";
}

public interface IEmailSender
{
    Task SendOtpAsync(string recipient, string otp, CancellationToken cancellationToken = default);
}

public sealed class GmailEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;
    private readonly ILogger<GmailEmailSender> _logger;

    public GmailEmailSender(IConfiguration configuration, ILogger<GmailEmailSender> logger)
    {
        _settings = configuration.GetSection("EmailSettings").Get<EmailSettings>() ?? new EmailSettings();
        _logger = logger;
    }

    public async Task SendOtpAsync(string recipient, string otp, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.Username) || string.IsNullOrWhiteSpace(_settings.Password))
            throw new InvalidOperationException("Chưa cấu hình EmailSettings.Username và EmailSettings.Password (Gmail App Password).");

        using var message = new MailMessage
        {
            From = new MailAddress(string.IsNullOrWhiteSpace(_settings.From) ? _settings.Username : _settings.From, _settings.DisplayName),
            Subject = "Mã OTP đặt lại mật khẩu - GPS Attendance",
            Body = $"Mã OTP của bạn là: {otp}\n\nMã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.",
            IsBodyHtml = false
        };
        message.To.Add(recipient);

        using var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(_settings.Username, _settings.Password)
        };
        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message);
        _logger.LogInformation("Đã gửi OTP đặt lại mật khẩu đến email đã đăng ký.");
    }
}
