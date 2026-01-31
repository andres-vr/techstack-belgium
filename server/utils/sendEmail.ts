import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'verification@techstack.be'

let resend: Resend | null = null

if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY)
}

/**
 * Send an OTP verification email using Resend
 */
export async function sendOtpEmail(to: string, otpCode: string): Promise<boolean> {
  if (!RESEND_API_KEY || !resend) {
    console.error('[sendOtpEmail] RESEND_API_KEY environment variable not set')
    // In development, log the OTP to console instead of failing
    if (process.env.NODE_ENV === 'development') {
      console.info(`[sendOtpEmail] DEV MODE - OTP for ${to}: ${otpCode}`)
      return true
    }
    throw new Error('Email service not configured')
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Techstack Belgium - Your Verification Code',
      html: `
        <html>
          <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e40af;">Email Verification</h1>
            <p>Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af; background: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              ${otpCode}
            </div>
            <p style="color: #64748b;">This code expires in 10 minutes.</p>
            <p style="color: #64748b;">If you didn't request this code, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px;">Techstack Belgium</p>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('[sendOtpEmail] Resend error:', error)
      throw new Error('Failed to send verification email')
    }

    console.info(`[sendOtpEmail] Email sent successfully to ${to}, ID:`, data?.id)
    return true
  } catch (error: any) {
    console.error('[sendOtpEmail] Failed to send email:', error.message || error)
    throw new Error('Failed to send verification email')
  }
}
