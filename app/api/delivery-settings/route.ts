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
    const settings = await prisma.deliverySettings.findFirst();
    
    if (!settings) {
      const defaultSettings = await prisma.deliverySettings.create({
        data: {
          isActive: true,
          chargeType: 'PERCENTAGE',
          minCharge: 0,
          percentageCharge: 8,
          freeDeliveryAbove: 500,
        },
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if ((await isauthenticated(req)) === false) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { chargeType, minCharge, percentageCharge, freeDeliveryAbove, isActive } = body;

    const settings = await prisma.deliverySettings.findFirst();

    if (settings) {
      const updated = await prisma.deliverySettings.update({
        where: { id: settings.id },
        data: {
          chargeType,
          minCharge: minCharge ?? 0,
          percentageCharge: percentageCharge ?? 8,
          freeDeliveryAbove: freeDeliveryAbove ?? 500,
          isActive: isActive ?? true,
        },
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.deliverySettings.create({
        data: {
          isActive: isActive ?? true,
          chargeType: chargeType ?? 'PERCENTAGE',
          minCharge: minCharge ?? 0,
          percentageCharge: percentageCharge ?? 8,
          freeDeliveryAbove: freeDeliveryAbove ?? 500,
        },
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error('Error updating delivery settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
