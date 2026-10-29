import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Protected by middleware

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const stateId = parseInt(id);

    if (isNaN(stateId)) {
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    const state = await prisma.stateDelivery.findUnique({
      where: { id: stateId },
    });

    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error('Error fetching state:', error);
    return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const stateId = parseInt(id);

    if (isNaN(stateId)) {
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    const body = await req.json();
    const { isActive, chargeType, minCharge, percentageCharge, freeDeliveryAbove } = body;

    // Get the state to find its name
    const existingState = await prisma.stateDelivery.findUnique({
      where: { id: stateId },
    });

    if (!existingState) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    const updated = await prisma.stateDelivery.update({
      where: { id: stateId },
      data: {
        isActive: isActive ?? true,
        chargeType: chargeType ?? 'PERCENTAGE',
        minCharge: minCharge ?? 0,
        percentageCharge: percentageCharge ?? 8,
        freeDeliveryAbove: freeDeliveryAbove ?? 500,
      },
    });

    // Apply settings to all pincodes in this state
    await prisma.pincodeDelivery.updateMany({
      where: { stateName: existingState.stateName },
      data: {
        isDelivery: isActive ?? true,
        chargeType: chargeType ?? 'PERCENTAGE',
        minCharge: minCharge ?? 0,
        percentageCharge: percentageCharge ?? 8,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating state:', error);
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const stateId = parseInt(id);

    if (isNaN(stateId)) {
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    await prisma.stateDelivery.delete({
      where: { id: stateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting state:', error);
    return NextResponse.json({ error: 'Failed to delete state' }, { status: 500 });
  }
}