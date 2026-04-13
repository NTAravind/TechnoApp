import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkpass } from '@/lib/adminauth';

async function isauthenticated(req: NextRequest) {
  const authhead = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authhead) {
    return false;
  }

  try {
    const [username, pass] = Buffer.from(authhead.split(" ")[1], "base64").toString().split(":");
    const usernameMatch = username === process.env.ADMIN_USERNAME;
    const passwordMatch = await checkpass(pass, process.env.HASHED_ADMIN_PASSWORD as string);
    return usernameMatch && passwordMatch;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if ((await isauthenticated(req)) === false) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get('pincode');
    const district = searchParams.get('district');
    const state = searchParams.get('state');

    const where: any = {};

    if (pincode && /^\d{6}$/.test(pincode)) {
      where.pincode = pincode;
    }

    if (district) {
      where.district = {
        contains: district.toUpperCase(),
        mode: 'insensitive',
      };
    }

    if (state) {
      where.stateName = {
        contains: state.toUpperCase(),
        mode: 'insensitive',
      };
    }

    if (Object.keys(where).length === 0) {
      return NextResponse.json({ error: 'Please provide at least one search criteria' }, { status: 400 });
    }

    const limit = pincode ? 100 : 50;
    
    const pincodes = await prisma.pincodeDelivery.findMany({
      where,
      take: limit,
      orderBy: [
        { pincode: 'asc' },
      ],
    });

    return NextResponse.json(pincodes);
  } catch (error) {
    console.error('Error searching pincodes:', error);
    return NextResponse.json({ error: 'Failed to search pincodes' }, { status: 500 });
  }
}
