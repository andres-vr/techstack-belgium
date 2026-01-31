import { deleteOtp, getStoredOtp } from '../utils/otpStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.email || typeof body.email !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  if (!body.code || typeof body.code !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Verification code is required',
    })
  }

  console.info(`[verify-otp] Verifying OTP for ${body.email}`)

  // Get stored OTP
  const storedOtp = getStoredOtp(body.email)

  if (!storedOtp) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Verification code expired or not found. Please request a new code.',
    })
  }

  // Compare codes
  if (storedOtp !== body.code.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid verification code',
    })
  }

  // Delete OTP after successful verification
  deleteOtp(body.email)

  console.info(`[verify-otp] OTP verified successfully for ${body.email}`)

  return {
    success: true,
    verified: true,
    message: 'Email verified successfully',
  }
})
