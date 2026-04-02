import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.gxcreality.com';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const from = process.env.RESEND_FROM || 'GXC Realty <no-reply@gxcreality.com>';

    await this.resend.emails.send({
      from,
      to,
      subject: 'Reset your GXC Realty password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#FDF8ED;padding:32px;border-radius:12px;border:1px solid rgba(180,130,30,0.18);">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;width:52px;height:52px;background:linear-gradient(135deg,#D4A843,#B8860B);border-radius:12px;line-height:52px;font-size:24px;">🏛️</div>
            <h1 style="margin:12px 0 4px;font-size:22px;color:#1a1200;">GXC<span style="color:#B8860B;">Realty</span></h1>
          </div>
          <h2 style="font-size:17px;color:#1a1200;margin-bottom:8px;">Password Reset Request</h2>
          <p style="color:#5a4a28;font-size:14px;line-height:1.6;margin-bottom:24px;">
            We received a request to reset the password for your account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#D4A843,#B8860B);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;">
              Reset Password
            </a>
          </div>
          <p style="color:#9a8060;font-size:12px;line-height:1.6;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not change.
          </p>
          <hr style="border:none;border-top:1px solid rgba(180,130,30,0.15);margin:20px 0;" />
          <p style="color:#9a8060;font-size:11px;text-align:center;">
            © GXC Realty · Exclusive Invite-Only Network
          </p>
        </div>
      `,
    });

    this.logger.log(`Password reset email sent to ${to}`);
  }
}
