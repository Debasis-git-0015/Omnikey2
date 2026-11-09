import { Resend } from 'resend';
import nodemailer from 'nodemailer';

/**
 * Sends a stylized Password Reset email directly to the user's specified email address.
 * Priority:
 *  1. SMTP (Gmail App Password or Generic SMTP like Brevo/Sendinblue) -> delivers to ANY email address with 0 domain restrictions.
 *  2. Resend API -> delivers to any email if custom domain is verified on Resend, or to the account owner.
 */
export const sendPasswordResetEmail = async ({ toEmail, userName, resetUrl }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER || emailUser;
  const smtpPass = process.env.SMTP_PASS || emailPass;

  // Check if Gmail SMTP credentials are provided and not a placeholder
  const isGmailConfigured = Boolean(
    emailUser && 
    emailPass && 
    !emailPass.includes('your_16_char') && 
    emailPass.trim().length >= 8
  );

  // Check if custom SMTP (e.g. Brevo, SendGrid, Mailgun) is configured
  const isCustomSmtpConfigured = Boolean(
    smtpHost && 
    smtpUser && 
    smtpPass && 
    !smtpPass.includes('your_')
  );

  const generateHtml = (targetEmail) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Omnikey Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F7FB; margin: 0; padding: 24px; color: #172033; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #E6EBF2; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(23, 32, 51, 0.05); }
        .header { background: #4F7CFF; padding: 36px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #172033; }
        .message { font-size: 14px; line-height: 1.6; color: #6B7890; margin-bottom: 24px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #4F7CFF; color: #ffffff !important; padding: 14px 34px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 14px rgba(79, 124, 255, 0.35); }
        .security-box { background: #F8FAFC; border: 1px solid #E6EBF2; border-radius: 14px; padding: 14px 18px; margin: 24px 0; font-size: 12px; color: #6B7890; }
        .fallback-link { word-break: break-all; font-size: 12px; color: #4F7CFF; text-decoration: underline; }
        .footer { background: #F8FAFC; border-top: 1px solid #E6EBF2; padding: 20px 24px; text-align: center; font-size: 11px; color: #94A3B8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Omnikey Password Manager</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">Secure Master Password Recovery</p>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${userName || 'Omnikey User'},</div>
          <div class="message">
            We received a request to reset the master password for your Omnikey vault associated with <strong>${targetEmail}</strong>.
          </div>
          
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Master Password</a>
          </div>

          <div class="security-box">
            ⏱️ <strong>Security Notice:</strong> This reset link will expire in <strong>60 minutes</strong>. If you did not make this request, your account remains secure and no changes have occurred.
          </div>

          <div class="message" style="font-size: 12px; margin-bottom: 0;">
            If the button above does not open, copy and paste this recovery link into your browser:
            <div style="margin-top: 8px;">
              <a href="${resetUrl}" class="fallback-link">${resetUrl}</a>
            </div>
          </div>
        </div>

        <div class="footer">
          &copy; ${new Date().getFullYear()} Omnikey Administrator • Zero-Knowledge AES-256 Vault Protection
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. PRIMARY: If Gmail SMTP App Password or Custom SMTP is configured
  if (isGmailConfigured || isCustomSmtpConfigured) {
    try {
      const transporter = isCustomSmtpConfigured
        ? nodemailer.createTransport({
            host: smtpHost,
            port: Number(smtpPort),
            secure: Number(smtpPort) === 465,
            auth: {
              user: smtpUser.trim(),
              pass: smtpPass.trim()
            }
          })
        : nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: emailUser.trim(),
              pass: emailPass.trim().replace(/\s+/g, '') // remove spaces from 16-char app password
            }
          });

      const senderAddress = isCustomSmtpConfigured
        ? `"Omnikey Security" <${smtpUser.trim()}>`
        : `"Omnikey Security" <${emailUser.trim()}>`;

      console.log(`[SMTP Dispatcher] Sending recovery email to ${toEmail} via ${senderAddress}...`);

      const info = await transporter.sendMail({
        from: senderAddress,
        to: toEmail,
        subject: '🔐 Reset Your Omnikey Master Password',
        html: generateHtml(toEmail)
      });

      console.log(`[SMTP Success] Email delivered to ${toEmail} with messageId: ${info.messageId}`);
      return {
        success: true,
        deliveredTo: toEmail,
        dispatcher: isCustomSmtpConfigured ? 'custom-smtp' : 'gmail-smtp',
        messageId: info.messageId
      };
    } catch (smtpErr) {
      console.error('[SMTP Error]:', smtpErr.message);
      throw new Error(`Email dispatch failed: ${smtpErr.message}`);
    }
  }

  // 2. SECONDARY: Resend API Dispatcher
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM || 'Omnikey <onboarding@resend.dev>';

  if (!apiKey) {
    throw new Error('Email service configuration missing: Please set RESEND_API_KEY or SMTP credentials in backend/.env');
  }

  const resend = new Resend(apiKey);

  console.log(`[Resend API] Attempting to dispatch recovery email to ${toEmail} from ${fromEmail}...`);

  const response = await resend.emails.send({
    from: fromEmail,
    to: [toEmail],
    subject: '🔐 Reset Your Omnikey Master Password',
    html: generateHtml(toEmail)
  });

  if (!response.error) {
    console.log(`[Resend Success] Email delivered to ${toEmail} with ID: ${response.data?.id}`);
    return {
      success: true,
      deliveredTo: toEmail,
      dispatcher: 'resend',
      messageId: response.data?.id
    };
  }

  // Handle Resend testing domain restriction
  if (response.error.message && response.error.message.includes('only send testing emails to your own email address')) {
    console.warn(`[Resend Sandbox Blocked] Cannot send to ${toEmail} using testing domain ${fromEmail}.`);
    throw new Error(
      `Resend's free testing domain (${fromEmail}) is restricted by Resend to only deliver to your account owner (drix.acc.0015@gmail.com). To send directly to "${toEmail}", either: 1) Enable 2-Step Verification and add a Gmail App Password in backend/.env, or 2) Use Brevo free SMTP (no domain required), or 3) Verify a custom domain on resend.com.`
    );
  }

  console.error('[Resend Error]:', response.error);
  throw new Error(response.error.message || 'Failed to dispatch email via Resend API');
};
