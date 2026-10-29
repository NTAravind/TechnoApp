import prisma from '@/lib/prisma';
import { DeliveryChargeType } from '@/app/generated/prisma';

export interface DeliveryChargeResult {
  deliveryCharge: number;
  isFreeDelivery: boolean;
  chargeType: DeliveryChargeType;
  minCharge: number;
  percentageCharge: number;
  freeDeliveryAbove: number;
  pincodeInfo?: {
    pincode: string;
    district?: string | null;
    state?: string | null;
  };
}

export async function calculateDeliveryCharge(
  pincode: string,
  cartSubtotal: number
): Promise<DeliveryChargeResult> {
  // Get default settings as fallback
  const settings = await prisma.deliverySettings.findFirst();
  
  const defaultResult: DeliveryChargeResult = {
    deliveryCharge: cartSubtotal * 0.08,
    isFreeDelivery: false,
    chargeType: DeliveryChargeType.PERCENTAGE,
    minCharge: 0,
    percentageCharge: 8,
    freeDeliveryAbove: 500,
  };

  if (!settings?.isActive) {
    return { ...defaultResult, isFreeDelivery: true, deliveryCharge: 0 };
  }

  // Get pincode data
  const pincodeData = await prisma.pincodeDelivery.findUnique({
    where: { pincode }
  });

  if (!pincodeData || !pincodeData.isDelivery) {
    throw new Error('Delivery not available for this pincode');
  }

  // Priority: Pincode overrides > State settings > Default settings
  let chargeType = pincodeData.chargeType;
  let minCharge = pincodeData.minCharge;
  let percentageCharge = pincodeData.percentageCharge;
  let freeDeliveryAbove = settings.freeDeliveryAbove;

  // Check if pincode has specific overrides
  const hasPincodeOverrides = pincodeData.minCharge !== null || pincodeData.percentageCharge !== null;

  if (!hasPincodeOverrides && pincodeData.stateName) {
    // Check state-level settings
    const stateSettings = await prisma.stateDelivery.findUnique({
      where: { stateName: pincodeData.stateName }
    });

    if (stateSettings && stateSettings.isActive) {
      chargeType = stateSettings.chargeType;
      minCharge = stateSettings.minCharge;
      percentageCharge = stateSettings.percentageCharge;
      freeDeliveryAbove = stateSettings.freeDeliveryAbove;
    }
  } else if (hasPincodeOverrides) {
    // Use pincode-specific overrides
    minCharge = pincodeData.minCharge ?? 0;
    percentageCharge = pincodeData.percentageCharge ?? 8;
  }

  // Calculate delivery charge
  let deliveryCharge = 0;
  const isFreeDelivery = cartSubtotal >= freeDeliveryAbove;

  if (!isFreeDelivery) {
    switch (chargeType) {
      case DeliveryChargeType.FIXED:
        deliveryCharge = minCharge;
        break;
      case DeliveryChargeType.PERCENTAGE:
        deliveryCharge = (cartSubtotal * percentageCharge) / 100;
        break;
      case DeliveryChargeType.BOTH:
        const percentageChargeAmount = (cartSubtotal * percentageCharge) / 100;
        deliveryCharge = Math.max(minCharge, percentageChargeAmount);
        break;
    }
  }

  return {
    deliveryCharge: Math.round(deliveryCharge * 100) / 100,
    isFreeDelivery,
    chargeType,
    minCharge,
    percentageCharge,
    freeDeliveryAbove,
    pincodeInfo: {
      pincode: pincodeData.pincode,
      district: pincodeData.district,
      state: pincodeData.stateName,
    },
  };
}

export function formatChargeType(type: DeliveryChargeType): string {
  switch (type) {
    case DeliveryChargeType.FIXED:
      return 'Fixed Charge';
    case DeliveryChargeType.PERCENTAGE:
      return 'Percentage';
    case DeliveryChargeType.BOTH:
      return 'Min or Percentage';
    default:
      return 'Unknown';
  }
}