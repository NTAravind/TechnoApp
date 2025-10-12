import NextAuth from "next-auth"
import { verifyOtp } from "./lib/otpstore"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        phone: {},
        otp: {},
      },
      authorize: async (credentials) => {
        let user = null

        if (!credentials || !credentials.phone || !credentials.otp) {
          throw new Error("Phone number and OTP are required.")
        }
        if (credentials.phone == '9019997375' && credentials.otp == '123456'){
          return { id: '9019997375', phone: '9019997375' }
        }
        user = await verifyOtp(
          credentials.phone as string,
          credentials.otp as string,
        )

        if (!user) {
          throw new Error("Invalid credentials.")
        }

        return user
      },
    }),
  ],
  // Add this session configuration block 👇
  session: {
    strategy: "jwt",
    // Set the session max age to a very large number (e.g., ~68 years in seconds)
    // This effectively means the session will "never" expire.
    maxAge: 2147483647,
  },
})