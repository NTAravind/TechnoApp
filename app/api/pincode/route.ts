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

    // Get default settings
    const settings = await prisma.deliverySettings.findFirst();
    
    // Check for state-level settings first (priority)
    let chargeType = pincodeData.chargeType;
    let minCharge = pincodeData.minCharge;
    let percentageCharge = pincodeData.percentageCharge;
    let freeDeliveryAbove = settings?.freeDeliveryAbove ?? 500;

    // Check if pincode has overrides, otherwise check state
    const hasPincodeOverrides = pincodeData.minCharge !== null || pincodeData.percentageCharge !== null;

    if (!hasPincodeOverrides && pincodeData.stateName) {
      const stateSettings = await prisma.stateDelivery.findUnique({
        where: { stateName: pincodeData.stateName }
      });

      if (stateSettings && stateSettings.isActive) {
        chargeType = stateSettings.chargeType;
        minCharge = stateSettings.minCharge;
        percentageCharge = stateSettings.percentageCharge;
        freeDeliveryAbove = stateSettings.freeDeliveryAbove;
      } else {
        // Use defaults
        chargeType = settings?.chargeType || 'PERCENTAGE';
        minCharge = settings?.minCharge ?? 0;
        percentageCharge = settings?.percentageCharge ?? 8;
      }
    } else if (hasPincodeOverrides) {
      // Use pincode-specific overrides
      minCharge = pincodeData.minCharge ?? 0;
      percentageCharge = pincodeData.percentageCharge ?? 8;
    } else {
      // Use defaults
      chargeType = settings?.chargeType || 'PERCENTAGE';
      minCharge = settings?.minCharge ?? 0;
      percentageCharge = settings?.percentageCharge ?? 8;
    }

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