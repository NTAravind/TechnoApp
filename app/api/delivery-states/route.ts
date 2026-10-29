import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Note: /admin routes are already protected by middleware
// This API endpoint is under /api/delivery-states which is also protected

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    // For search suggestions - get unique states from pincodes table
    if (search) {
      const pincodes = await prisma.pincodeDelivery.findMany({
        where: {
          stateName: { contains: search.toUpperCase(), mode: 'insensitive' },
        },
        select: { stateName: true },
        distinct: ['stateName'],
        take: 10,
      });
      
      // Check which have settings
      const statesWithSettings = await prisma.stateDelivery.findMany({
        where: {
          stateName: { in: pincodes.map(p => p.stateName).filter(Boolean) as string[] },
        },
        select: { stateName: true },
      });
      
      const statesWithSettingsSet = new Set(statesWithSettings.map(s => s.stateName));
      
      const result = pincodes.map((p, i) => ({
        stateName: p.stateName,
        hasSettings: statesWithSettingsSet.has(p.stateName!),
        id: i,
      })).filter(s => s.stateName);
      
      return NextResponse.json(result);
    }

    // Full list with counts - show all states from pincode table
    const allStates = await prisma.pincodeDelivery.findMany({
      select: { stateName: true },
      distinct: ['stateName'],
    });

    const stateSettings = await prisma.stateDelivery.findMany({
      orderBy: { stateName: 'asc' },
    });

    const settingsMap = new Map(stateSettings.map(s => [s.stateName, s]));

    const statesWithCount = await Promise.all(
      allStates.map(async (s, index) => {
        const stateName = s.stateName!;
        const settings = settingsMap.get(stateName);
        const count = await prisma.pincodeDelivery.count({
          where: { stateName },
        });
        
        return {
          id: settings?.id || -1 - index,
          stateName,
          isActive: settings?.isActive ?? false,
          chargeType: settings?.chargeType ?? 'PERCENTAGE',
          minCharge: settings?.minCharge ?? 0,
          percentageCharge: settings?.percentageCharge ?? 8,
          freeDeliveryAbove: settings?.freeDeliveryAbove ?? 500,
          pincodesCount: count,
          hasSettings: !!settings,
        };
      })
    );

    return NextResponse.json(statesWithCount);
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json({ error: 'Failed to fetch states' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stateName, isActive, chargeType, minCharge, percentageCharge, freeDeliveryAbove } = body;

    if (!stateName) {
      return NextResponse.json({ error: 'State name is required' }, { status: 400 });
    }

    const existing = await prisma.stateDelivery.findUnique({
      where: { stateName: stateName.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'State already exists' }, { status: 400 });
    }

    const newState = await prisma.stateDelivery.create({
      data: {
        stateName: stateName.toUpperCase(),
        isActive: isActive ?? true,
        chargeType: chargeType ?? 'PERCENTAGE',
        minCharge: minCharge ?? 0,
        percentageCharge: percentageCharge ?? 8,
        freeDeliveryAbove: freeDeliveryAbove ?? 500,
      },
    });

    // Apply settings to all pincodes in this state
    await prisma.pincodeDelivery.updateMany({
      where: { stateName: stateName.toUpperCase() },
      data: {
        isDelivery: isActive ?? true,
        chargeType: chargeType ?? 'PERCENTAGE',
        minCharge: minCharge ?? 0,
        percentageCharge: percentageCharge ?? 8,
      },
    });

    return NextResponse.json(newState);
  } catch (error) {
    console.error('Error creating state:', error);
    return NextResponse.json({ error: 'Failed to create state' }, { status: 500 });
  }
}