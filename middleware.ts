import { checkpass } from "@/lib/adminauth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Generate hash on first deployment - remove this after setting HASHED_ADMIN_PASSWORD
  if (!process.env.HASHED_ADMIN_PASSWORD && process.env.ADMIN_PASSWORD) {
    const generatedHash = await generateHashForPassword(process.env.ADMIN_PASSWORD);
    console.log("=== HASH GENERATION ===");
    console.log("Generated hash for your password:", generatedHash);
    console.log("Set this as your HASHED_ADMIN_PASSWORD environment variable");
    console.log("Then remove ADMIN_PASSWORD and this generation code");
    console.log("=======================");
  }

  if ((await isauthenticated(req)) === false) {
    return new NextResponse("UnAuthorized", { 
      status: 401, 
      headers: { "WWW-Authenticate": "Basic" } 
    });
  }
}

async function isauthenticated(req: NextRequest) {
  const authhead = req.headers.get("authorization") || req.headers.get("Authorization");
  
  if (authhead == null) {
    console.log("No authorization header found");
    return false;
  }
  
  try {
    const [username, pass] = Buffer.from(authhead.split(" ")[1], "base64").toString().split(":");
    
    console.log("Auth attempt - Username:", username);
    console.log("Expected username:", process.env.ADMIN_USERNAME);
    
    const usernameMatch = username === process.env.ADMIN_USERNAME;
    const passwordMatch = await checkpass(pass, process.env.HASHED_ADMIN_PASSWORD as string);
    
    console.log("Username match:", usernameMatch);
    console.log("Password match:", passwordMatch);
    
    return usernameMatch && passwordMatch;
  } catch (error) {
    console.log("Error parsing auth header:", error);
    return false;
  }
}

// Helper function to generate hash in the same environment
async function generateHashForPassword(password: string) {
  const arrayBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(password));
  return Buffer.from(arrayBuffer).toString("base64");
}

export const config = {
  matcher: "/admin/:path*",
};