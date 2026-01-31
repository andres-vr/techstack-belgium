import { generateOtp, storeOtp } from '../utils/otpStore'
import { sendOtpEmail } from '../utils/sendEmail'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.email || typeof body.email !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  const email = body.email.toLowerCase().trim()
  
  console.info(`[verify-email] Sending OTP to ${email}`)

  // Generate a 6-digit OTP
  const otpCode = generateOtp()
  
  // Store OTP with 10-minute expiration
  storeOtp(email, otpCode, 600) // 10 minutes

  try {
    // Send OTP email via Resend
    await sendOtpEmail(email, otpCode)
    
    console.info(`[verify-email] OTP sent successfully to ${email}`)
    
    return {
      success: true,
      message: 'Verification code sent successfully',
    }
  } catch (error: any) {
    console.error('[verify-email] Failed to send OTP email:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification email',
    })
  }
})