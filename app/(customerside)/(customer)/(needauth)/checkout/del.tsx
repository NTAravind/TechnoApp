'use client';
import React, { useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Truck, CreditCard, IndianRupee, Clock } from "lucide-react";
import ProductCart from '@/lib/store';
import { fcurrency } from '@/lib/utils';

interface DeliveryModeSelectorProps {
  value: boolean; // true = Online Payment (prepaid), false = COD
  onChange: (value: boolean) => void;
  isDistributor?: boolean;
}

export default function DeliveryModeSelector({
  value,
  onChange,
  isDistributor = false,
}: DeliveryModeSelectorProps) {
  const { getTotalPrice } = ProductCart();
  const subtotal = getTotalPrice();

  // Calculate prices for both modes
  const prices = useMemo(() => {
    const distributorDiscount = isDistributor ? subtotal * 0.1 : 0;
    const subtotalAfterDiscount = subtotal - distributorDiscount;
    const deliveryCharge = subtotal * 0.08;
    const platformFee = subtotalAfterDiscount * 0.04;

    return {
      cod: {
        subtotal,
        distributorDiscount,
        subtotalAfterDiscount,
        deliveryCharge,
         
        total: subtotalAfterDiscount + deliveryCharge 
      },
      online: {
        subtotal,
        distributorDiscount,
        subtotalAfterDiscount,
        deliveryCharge,
        platformFee,
        total: subtotalAfterDiscount + deliveryCharge + platformFee
      }
    };
  }, [subtotal, isDistributor]);

  return (
    <div className="mb-8">
      <Label className="block text-base font-semibold text-gray-800 mb-4">
        Select Payment & Delivery Mode
      </Label>
      
      <RadioGroup
        value={value ? "online" : "cod"}
        onValueChange={(val) => onChange(val === "online")}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Cash on Delivery Option */}
        <div className="relative">
          <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
          <Label
            htmlFor="cod"
            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-orange-500 [&:has([data-state=checked])]:border-orange-500 peer-data-[state=checked]:bg-orange-50 cursor-pointer transition-all duration-200 h-full shadow-sm hover:shadow-md"
          >
            <Truck className="h-10 w-10 mb-4 text-orange-600" />
            <div className="text-center space-y-3 w-full">
              <div className="font-semibold text-lg">Cash on Delivery</div>
              <p className="text-sm text-muted-foreground">
                Pay in cash when your order is delivered
              </p>
              
              {/* Price Breakdown for COD */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{fcurrency(prices.cod.subtotal)}</span>
                </div>
                
                {isDistributor && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discount (10%):</span>
                    <span className="font-medium text-green-600">-{fcurrency(prices.cod.distributorDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivery (8%):</span>
                  <span className="font-medium">{fcurrency(prices.cod.deliveryCharge)}</span>
                </div>
                
            
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-semibold text-orange-700">Total Amount:</span>
                  <span className="font-bold text-lg text-orange-700">{fcurrency(prices.cod.total)}</span>
                </div>
              </div>
            </div>
          </Label>
        </div>

        {/* Online Payment Option */}
        <div className="relative">
          <RadioGroupItem value="online" id="online" className="peer sr-only" />
          <Label
            htmlFor="online"
            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 peer-data-[state=checked]:bg-green-50 cursor-pointer transition-all duration-200 h-full shadow-sm hover:shadow-md"
          >
            <CreditCard className="h-10 w-10 mb-4 text-green-600" />
            <div className="text-center space-y-3 w-full">
              <div className="font-semibold text-lg">Online Payment</div>
              <p className="text-sm text-muted-foreground">
                Pay now securely via UPI, Card, or Netbanking
              </p>
              
              {/* Price Breakdown for Online */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{fcurrency(prices.online.subtotal)}</span>
                </div>
                
                {isDistributor && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discount (10%):</span>
                    <span className="font-medium text-green-600">-{fcurrency(prices.online.distributorDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivery (8%):</span>
                  <span className="font-medium">{fcurrency(prices.online.deliveryCharge)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Platform Fee (4%):</span>
                  <span className="font-medium">{fcurrency(prices.online.platformFee)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-semibold text-green-700">Total Amount:</span>
                  <span className="font-bold text-lg text-green-700">{fcurrency(prices.online.total)}</span>
                </div>
              </div>
            </div>
          </Label>
        </div>
      </RadioGroup>

      {/* Additional Information */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3 text-sm text-blue-900">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium">Delivery Timeline</p>
            <p className="text-blue-800">
              Orders are delivered within <strong>72 hours</strong> across both payment modes.
            </p>
           
          </div>
        </div>
      </div>
    </div>
  );
}