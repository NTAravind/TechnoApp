'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, MapPin, CheckCircle, Phone, Clock, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative h-[100vh] sm:h-[90vh] lg:h-[80vh] flex items-center justify-center overflow-hidden lg:-mt-24">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('image 3(1).webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/50 sm:bg-black/40"></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge className="mb-6 sm:mb-8 bg-white text-green-800 text-xs sm:text-sm px-4 sm:px-8 py-1.5 sm:py-2 font-medium">
          Sustainable Industrial Solutions
        </Badge>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 lg:mb-8 leading-tight tracking-tight">
          Innovative Solutions,<br className="hidden sm:block" />
          <span className="sm:hidden"> </span>Trusted Quality
        </h1>
        
        <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-8 sm:mb-12 lg:mb-16 max-w-xl lg:max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
          Delivering excellence across irrigation, oils, and cleaning for a sustainable future.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
          <Link href="/products" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-green-800 hover:bg-green-600 hover:text-white hover:border-0 h-12 sm:h-14 lg:h-16 px-6 sm:px-8 text-sm sm:text-base font-medium transition-all duration-200 shadow-lg"
            >
              Shop Now <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
          
          <Link href="/products" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto bg-green-600 text-white border-green-600 hover:border-white hover:bg-white hover:text-green-900 h-12 sm:h-14 lg:h-16 px-6 sm:px-8 text-sm sm:text-base font-medium transition-all duration-200"
            >
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
