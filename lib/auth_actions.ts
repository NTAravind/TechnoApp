// lib/auth-actions.ts
"use server"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export async function authenticateUser(phone: string, otp: string) {
  try {
    // Clean phone number before authentication
    const cleanPhone = phone.replace(/\D/g, '')
    
    const result = await signIn("credentials", {
      phone: cleanPhone,
      otp: otp,
      redirect: false, // Important: Don't auto-redirect
    })
    
    if (result?.error) {
      console.log("SignIn result error:", result.error)
      return { success: false, error: 'Invalid OTP. Please try again.' }
    }
    
    // If we get here, authentication was successful
    console.log("Authentication successful")
    return { success: true }
    
  } catch (error) {
    console.error("Authentication error:", error)
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid OTP. Please try again.' }
        case 'AccessDenied':
          return { success: false, error: 'Access denied. Please try again.' }
        default:
          return { success: false, error: 'Authentication failed. Please try again.' }
      }
    }
    
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}