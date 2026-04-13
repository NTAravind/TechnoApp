import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get('pincode');

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid pincode format. Please enter a 6-digit pincode.'
      }, { status: 400 });
    }

    const pincodeData = await prisma.pincodeDelivery.findUnique({
      where: { pincode }
    });

    if (!pincodeData) {
      return NextResponse.json({
        valid: false,
        error: 'We do not deliver to this pincode yet. Please contact us for assistance.',
        pincode
      }, { status: 404 });
    }

    if (!pincodeData.isDelivery) {
      return NextResponse.json({
        valid: false,
        error: 'Sorry, delivery is not available in your area.',
        pincode,
        district: pincodeData.district,
        state: pincodeData.stateName
      }, { status: 200 });
    }

    const settings = await prisma.deliverySettings.findFirst();
    
    const chargeType = pincodeData.chargeType || settings?.chargeType || 'PERCENTAGE';
    const minCharge = pincodeData.minCharge ?? settings?.minCharge ?? 0;
    const percentageCharge = pincodeData.percentageCharge ?? settings?.percentageCharge ?? 8;
    const freeDeliveryAbove = settings?.freeDeliveryAbove ?? 500;

    return NextResponse.json({
      valid: true,
      pincode: pincodeData.pincode,
      district: pincodeData.district,
      state: pincodeData.stateName,
      region: pincodeData.regionName,
      chargeType,
      minCharge,
      percentageCharge,
      freeDeliveryAbove
    }, { status: 200 });

  } catch (error) {
    console.error('Pincode validation error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Failed to validate pincode. Please try again.'
    }, { status: 500 });
  }
}
