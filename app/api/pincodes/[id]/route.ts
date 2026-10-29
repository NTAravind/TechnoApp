import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Protected by middleware

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pincodeId = parseInt(id);

    if (isNaN(pincodeId)) {
      return NextResponse.json({ error: 'Invalid pincode ID' }, { status: 400 });
    }

    const pincode = await prisma.pincodeDelivery.findUnique({
      where: { id: pincodeId },
    });

    if (!pincode) {
      return NextResponse.json({ error: 'Pincode not found' }, { status: 404 });
    }

    return NextResponse.json(pincode);
  } catch (error) {
    console.error('Error fetching pincode:', error);
    return NextResponse.json({ error: 'Failed to fetch pincode' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pincodeId = parseInt(id);

    if (isNaN(pincodeId)) {
      return NextResponse.json({ error: 'Invalid pincode ID' }, { status: 400 });
    }

    const body = await req.json();
    const { isDelivery, chargeType, minCharge, percentageCharge } = body;

    const updated = await prisma.pincodeDelivery.update({
      where: { id: pincodeId },
      data: {
        isDelivery: isDelivery ?? true,
        chargeType: chargeType ?? 'PERCENTAGE',
        minCharge: minCharge ?? null,
        percentageCharge: percentageCharge ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating pincode:', error);
    return NextResponse.json({ error: 'Failed to update pincode' }, { status: 500 });
  }
}