import NextAuth from "next-auth"
import { verifyOtp } from "./lib/otpstore"
import Credentials from "next-auth/providers/credentials"
import { PrismaClient } from "@/app/generated/prisma"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // CUSTOMER LOGIN (Your original working setup)
    Credentials({
      id: 'customer-login',
      name: 'Customer Login',
      credentials: {
        phone: {},
        otp: {},
      },
      authorize: async (credentials) => {
        let user = null
        if (!credentials || !credentials.phone || !credentials.otp) {
          throw new Error("Phone number and OTP are required.")
        }
        
        // Test account bypass
        if (credentials.phone == '9019997375' && credentials.otp == '123456'){
          return { 
            id: '9019997375', 
            phone: '9019997375',
            role: 'customer'
          }
        }
        
        user = await verifyOtp(
          credentials.phone as string,
          credentials.otp as string,
        )
        
        if (!user) {
          throw new Error("Invalid credentials.")
        }
        
        return { ...user, role: 'customer' }
      },
    }),

    // PARTNER LOGIN (New - separate provider)
    Credentials({
      id: 'partner-login',
      name: 'Partner Login',
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password are required.")
        }

        const partner = await prisma.partner.findUnique({
          where: { username: credentials.username as string }
        })

        if (!partner) {
          throw new Error("Invalid credentials.")
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          partner.password
        )

        if (!isValidPassword) {
          throw new Error("Invalid credentials.")
        }

        return {
          id: partner.id,
          name: partner.name,
          username: partner.username,
          role: 'partner'
        }
      },
    }),
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 2147483647, // Your original setting - never expire
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
        token.partnerId = user.id
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.username = token.username as string
        session.user.partnerId = token.partnerId as string
        session.user.phone = token.phone as string
        session.user.id = token.partnerId as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home page after customer login
      if (url.startsWith('/login')) {
        return baseUrl
      }
      // If it's a callback URL, use it
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Otherwise go to base URL
      return baseUrl
    }
  },
  
  pages: {
    signIn: '/login', // Customer login page
  },
  
  debug: process.env.NODE_ENV === 'development',
})