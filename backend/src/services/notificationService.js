const nodemailer = require("nodemailer");
const twilio = require("twilio");

class NotificationService {
  constructor() {
    // Initialize email transporter only if configured
    this.emailTransporter = null;
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === "465",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }

    // Initialize Twilio client only if configured with valid values
    this.twilioClient = null;
    if (
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_ACCOUNT_SID.startsWith("AC")
    ) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  /**
   * Send winning voucher notification
   */
  async sendWinNotification(userProfile, voucher, voucherCode) {
    const promises = [];

    // Send email if available
    if (userProfile.email) {
      promises.push(this.sendWinEmail(userProfile, voucher, voucherCode));
    }

    // Send SMS if available and Twilio is configured
    if (userProfile.phone && this.twilioClient) {
      promises.push(this.sendWinSMS(userProfile, voucher, voucherCode));
    }

    try {
      await Promise.allSettled(promises);
      console.log("Notifications sent successfully");
    } catch (error) {
      console.error("Error sending notifications:", error);
      // Don't throw - notification failure shouldn't break the main flow
    }
  }

  /**
   * Send winning email
   */
  async sendWinEmail(userProfile, voucher, voucherCode) {
    if (!this.emailTransporter) {
      console.log("Email not configured - skipping email notification");
      return;
    }

    const emailTemplate = this.generateWinEmailTemplate(
      userProfile,
      voucher,
      voucherCode
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userProfile.email,
      subject: "🎉 Chúc mừng! Bạn đã trúng thưởng phiếu may mắn!",
      html: emailTemplate,
      text: this.generateWinEmailText(userProfile, voucher, voucherCode),
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log("Win email sent to:", userProfile.email);
    } catch (error) {
      console.error("Failed to send win email:", error);
      throw error;
    }
  }

  /**
   * Send winning SMS
   */
  async sendWinSMS(userProfile, voucher, voucherCode) {
    const message = `🎉 Chúc mừng ${userProfile.full_name}! Bạn đã trúng: ${
      voucher.face_value
    }! Mã của bạn: ${voucherCode}. Có hiệu lực đến ${
      voucher.valid_to || "ngày được chỉ định"
    }. Áp dụng điều khoản.`;

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: userProfile.phone,
      });
      console.log("Win SMS sent to:", userProfile.phone);
    } catch (error) {
      console.error("Failed to send win SMS:", error);
      throw error;
    }
  }

  /**
   * Send participation confirmation
   */
  async sendParticipationConfirmation(userProfile) {
    if (!userProfile.email || !this.emailTransporter) return;

    const emailTemplate = this.generateParticipationEmailTemplate(userProfile);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userProfile.email,
      subject: "Cảm ơn bạn đã tham gia chương trình quay số may mắn!",
      html: emailTemplate,
      text: `Kính gửi ${userProfile.full_name}, cảm ơn bạn đã tham gia chương trình quay số may mắn của chúng tôi! Chúc bạn may mắn!`,
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log("Participation email sent to:", userProfile.email);
    } catch (error) {
      console.error("Failed to send participation email:", error);
      // Don't throw for participation emails
    }
  }

  /**
   * Generate winning email HTML template
   */
  generateWinEmailTemplate(userProfile, voucher, voucherCode) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bạn đã trúng thưởng!</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .voucher-box { background: #f8f9ff; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
            .code { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; margin: 10px 0; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Chúc mừng!</h1>
                <p>Bạn là người may mắn trúng thưởng!</p>
            </div>
            <div class="content">
                <p>Kính gửi <strong>${userProfile.full_name}</strong>,</p>
                <p>Tin tuyệt vời! Bạn đã trúng thưởng trong chương trình quay số may mắn của chúng tôi!</p>
                
                <div class="voucher-box">
                    <h3>Phần thưởng của bạn:</h3>
                    <h2>${voucher.name}</h2>
                    <p><strong>${voucher.face_value}</strong></p>
                    <div class="code">${voucherCode}</div>
                    <p><small>Mã phiếu mua hàng duy nhất của bạn</small></p>
                </div>

                <h4>Cách sử dụng phiếu mua hàng:</h4>
                <ol>
                    <li>Sao chép mã phiếu mua hàng ở trên</li>
                    <li>Truy cập website hoặc cửa hàng của chúng tôi</li>
                    <li>Nhập mã khi thanh toán</li>
                    <li>Tận hưởng ưu đãi của bạn!</li>
                </ol>

                <p><strong>Quan trọng:</strong></p>
                <ul>
                    <li>Phiếu này có hiệu lực đến ${
                      voucher.valid_to || "ngày hết hạn được chỉ định"
                    }</li>
                    <li>Không thể kết hợp với các ưu đãi khác</li>
                    <li>Chỉ sử dụng một lần</li>
                    <li>Không thể chuyển nhượng</li>
                </ul>

                <div style="text-align: center;">
                    <a href="#" class="btn">Mua sắm ngay</a>
                </div>
            </div>
            <div class="footer">
                <p>Cảm ơn bạn đã tham gia chương trình quay số may mắn của chúng tôi!</p>
                <p>Có câu hỏi? Liên hệ chúng tôi tại support@luckyvoucher.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate winning email text version
   */
  generateWinEmailText(userProfile, voucher, voucherCode) {
    return `
🎉 Chúc mừng ${userProfile.full_name}!

Bạn đã trúng thưởng trong chương trình quay số may mắn của chúng tôi!

Phần thưởng của bạn: ${voucher.name}
Giá trị: ${voucher.face_value}
Mã: ${voucherCode}

Cách sử dụng:
1. Sao chép mã phiếu mua hàng: ${voucherCode}
2. Truy cập website hoặc cửa hàng của chúng tôi
3. Nhập mã khi thanh toán
4. Tận hưởng ưu đãi của bạn!

Quan trọng:
- Có hiệu lực đến ${voucher.valid_to || "ngày được chỉ định"}
- Không thể kết hợp với các ưu đãi khác
- Chỉ sử dụng một lần
- Không thể chuyển nhượng

Cảm ơn bạn đã tham gia!
Có câu hỏi? Liên hệ support@luckyvoucher.com
    `;
  }

  /**
   * Generate participation confirmation email template
   */
  generateParticipationEmailTemplate(userProfile) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { margin-bottom: 20px; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍀 Cảm ơn bạn đã tham gia!</h1>
            </div>
            <div class="content">
                <p>Kính gửi <strong>${userProfile.full_name}</strong>,</p>
                <p>Cảm ơn bạn đã tham gia chương trình quay số may mắn của chúng tôi! Thông tin tham gia của bạn đã được ghi nhận.</p>
                <p>Dù bạn có trúng thưởng hay không, chúng tôi đều đánh giá cao sự tham gia của bạn. Hãy theo dõi để biết thêm các chương trình khuyến mãi thú vị!</p>
                <p>Theo dõi chúng tôi trên mạng xã hội để cập nhật tin tức và ưu đãi mới nhất.</p>
            </div>
            <div class="footer">
                <p>Hệ thống Phiếu May mắn</p>
                <p>Truy cập chúng tôi tại www.luckyvoucher.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Test email configuration
   */
  async testEmailConfig() {
    if (!this.emailTransporter) {
      console.log("⚠️ Email not configured");
      return false;
    }

    try {
      await this.emailTransporter.verify();
      console.log("✅ Email configuration is valid");
      return true;
    } catch (error) {
      console.error("❌ Email configuration error:", error);
      return false;
    }
  }
}

module.exports = NotificationService;
