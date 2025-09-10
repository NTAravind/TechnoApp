// auth.ts (or wherever your NextAuth config is)
import NextAuth from "next-auth"
import { verifyOtp } from "./lib/otpstore"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        otp: { label: "OTP", type: "text" },
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.phone || !credentials?.otp) {
            console.log("Missing credentials")
            return null
          }

          const phone = credentials.phone as string
          const otp = credentials.otp as string

          console.log("Attempting to verify OTP for phone:", phone)
          
          const user = await verifyOtp(phone, otp)
          
          if (!user) {
            console.log("OTP verification failed")
            return null
          }

          console.log("OTP verification successful for:", phone)
          return {
            id: user.id,
            name: user.name,
            phone: user.name, // Store phone number
          }
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (more reasonable than max int)
  },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.phone = user.name || user.name
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.name = token.phone as string
        session.user.name = token.phone as string
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
})