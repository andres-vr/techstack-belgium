/**
 * Simple in-memory OTP storage for email verification
 * In production, consider using Redis or a database for persistence across server restarts
 */

interface OtpEntry {
  code: string;
  expires: number;
}

const otpStore = new Map<string, OtpEntry>();

/**
 * Store an OTP code for an email with a TTL
 */
export function storeOtp(
  email: string,
  code: string,
  ttlSeconds: number,
): void {
  otpStore.set(email.toLowerCase(), {
    code,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Retrieve the stored OTP for an email, or null if expired/not found
 */
export function getStoredOtp(email: string): string | null {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    otpStore.delete(email.toLowerCase());
    return null;
  }

  return entry.code;
}

/**
 * Delete the OTP for an email (call after successful verification)
 */
export function deleteOtp(email: string): void {
  otpStore.delete(email.toLowerCase());
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
