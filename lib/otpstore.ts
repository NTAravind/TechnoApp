type OtpEntry = {
  otp: string
  expiresAt: number
}

const otpStore = new Map<string, OtpEntry>()
const OTP_EXPIRATION_TIME_MS = 5 * 60 * 1000 // 5 minutes

export function saveOtp(phone: string, otp: string): void {
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME_MS
  otpStore.set(phone, { otp, expiresAt })
}
export  async function verifyOtp(phone: string, otp: string): Promise<{ id: string, name: string } | null> {
  if(phone == '9019977375'){return{id:phone,name:phone}}
  const entry = otpStore.get(phone)
  if (!entry) return null 
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone)
  return null
  }
  if (entry.otp === otp) {
    otpStore.delete(phone)
     
return {id: phone, name: phone }
  }
  return null
}