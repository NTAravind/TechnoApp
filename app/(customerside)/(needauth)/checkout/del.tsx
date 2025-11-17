'use client'
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Store } from "lucide-react";

interface DeliveryModeSelectorProps {
  value: boolean;
  onChange: (value: boolean) => void; // true = Delivery, false = Pick Up
}

export default function DeliveryModeSelector({
  value,
  onChange,
}: DeliveryModeSelectorProps) {
  return (
    <div className="mb-6">
      <Label className="block text-sm font-medium text-gray-700 mb-3">
        Choose Delivery Method
      </Label>
      
      <RadioGroup
        value={value ? "delivery" : "pickup"}
        onValueChange={(val) => {
          onChange(val === "delivery");
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Pickup Option */}
        <div className="relative">
          <RadioGroupItem 
            value="pickup" 
            id="pickup" 
            className="peer sr-only" 
          />
          <Label 
            htmlFor="pickup" 
            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
          >
            <Store className="h-6 w-6 mb-2 text-muted-foreground" />
            <div className="text-center">
              <div className="font-medium">Pick Up</div>
              <div className="text-sm text-muted-foreground">Collect from store / arrange delivery </div>
         
            </div>
          </Label>
        </div>

        {/* Delivery Option */}
        <div className="relative">
          <RadioGroupItem 
            value="delivery" 
            id="delivery" 
            className="peer sr-only" 
          />
          <Label 
            htmlFor="delivery" 
            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
          >
            <Truck className="h-6 w-6 mb-2 text-muted-foreground" />
            <div className="text-center">
              <div className="font-medium">Delivery</div>
              <div className="text-sm text-muted-foreground">To your address</div>
             
            </div>
          </Label>
        </div>
      </RadioGroup>
      
      {/* Additional Info */}
      <div className="mt-3 text-xs text-muted-foreground">
        {value ? (
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3" />
            Delivery within 24-48 hours
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Store className="h-3 w-3" />
            Ready for pickup within 48 - 72  Hours
          </div>
        )}
      </div>
    </div>
  );
}