import { NextRequest, NextResponse } from 'next/server';
import { checkpass } from '@/lib/adminauth';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authhead = req.headers.get("authorization") || req.headers.get("Authorization");
    
    if (!authhead) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    try {
      const [username, pass] = Buffer.from(authhead.split(" ")[1], "base64").toString().split(":");
      
      if (!process.env.ADMIN_USERNAME || !process.env.HASHED_ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
      }
      
      const usernameMatch = username === process.env.ADMIN_USERNAME;
      const passwordMatch = await checkpass(pass, process.env.HASHED_ADMIN_PASSWORD as string);
      
      if (usernameMatch && passwordMatch) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid authorization format' }, { status: 401 });
    }
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}