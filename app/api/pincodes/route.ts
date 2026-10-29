import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Protected by middleware

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get('pincode');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (pincode && /^\d{6}$/.test(pincode)) {
      where.pincode = pincode;
    } else if (pincode) {
      where.pincode = { startsWith: pincode };
    }

    if (Object.keys(where).length === 0) {
      return NextResponse.json({ error: 'Please provide a pincode to search' }, { status: 400 });
    }

    const pincodes = await prisma.pincodeDelivery.findMany({
      where,
      take: limit,
      orderBy: { pincode: 'asc' },
    });

    return NextResponse.json(pincodes);
  } catch (error) {
    console.error('Error searching pincodes:', error);
    return NextResponse.json({ error: 'Failed to search pincodes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pincode, isDelivery, chargeType, minCharge, percentageCharge } = body;

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json({ error: 'Valid 6-digit pincode required' }, { status: 400 });
    }

    const existing = await prisma.pincodeDelivery.findUnique({
      where: { pincode },
    });

    if (existing) {
      const updated = await prisma.pincodeDelivery.update({
        where: { pincode },
        data: {
          isDelivery: isDelivery ?? existing.isDelivery,
          chargeType: chargeType ?? existing.chargeType,
          minCharge: minCharge ?? existing.minCharge,
          percentageCharge: percentageCharge ?? existing.percentageCharge,
        },
      });
      return NextResponse.json(updated);
    }

    const newPincode = await prisma.pincodeDelivery.create({
      data: {
        pincode,
        isDelivery: isDelivery ?? true,
        chargeType: chargeType ?? 'PERCENTAGE',
        minCharge: minCharge ?? null,
        percentageCharge: percentageCharge ?? null,
      },
    });

    return NextResponse.json(newPincode);
  } catch (error) {
    console.error('Error creating pincode:', error);
    return NextResponse.json({ error: 'Failed to create pincode' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'reset-all') {
      const result = await prisma.pincodeDelivery.updateMany({
        data: {
          isDelivery: true,
          chargeType: 'PERCENTAGE',
          minCharge: null,
          percentageCharge: null,
        },
      });

      return NextResponse.json({ 
        message: 'All delivery settings reset', 
        updatedCount: result.count 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error resetting pincodes:', error);
    return NextResponse.json({ error: 'Failed to reset pincodes' }, { status: 500 });
  }
}