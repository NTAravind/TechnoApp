import { checkpass } from "@/lib/adminauth";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Super Admin routes with basic auth
  if (pathname.startsWith('/admin')) {
    // Generate hash on first deployment
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

  // Partner routes with NextAuth
  if (pathname.startsWith('/partner')) {
    console.log('🔍 Partner route accessed:', pathname);
    
    // Allow login page without authentication
    if (pathname === '/partner/login') {
      console.log('✅ Login page - allowing access');
      return NextResponse.next();
    }

    console.log('🔐 Checking session for protected route...');
    // Check authentication for all other partner routes
    const session = await auth();
    console.log('📋 Session:', session ? 'exists' : 'null', 'Role:', session?.user?.role);
    
    if (!session || session.user?.role !== 'partner') {
      console.log('❌ No valid session - redirecting to login');
      return NextResponse.redirect(new URL('/partner/login', req.url));
    }
    
    console.log('✅ Valid session - allowing access');
  }

  return NextResponse.next();
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

async function generateHashForPassword(password: string) {
  const arrayBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(password));
  return Buffer.from(arrayBuffer).toString("base64");
}

// Only match the specific routes we want to protect
export const config = {
  matcher: [
    "/admin/:path*", 
    "/partner/:path*"
  ],
};