// components/CategoriesSection.tsx
'use client'
import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const shopCategories = [
  { name: 'Drip Pipe', href: '/products?category=1' },
  { name: 'Micro Tube', href: '/products?category=2' },
  { name: 'Drip Fittings', href: '/products?category=3' },
  { name: 'PVC Fittings', href: '/products?category=4' },
  { name: 'Turpentine Oil', href: '/products?category=5' },
  { name: 'PVC Gum', href: '/products?category=6' },
  { name: 'Nursery Cover', href: '/products?category=7' },
  { name: 'Rain Pipe', href: '/products?category=8' },
  { name: 'Consumer', href: '/products?category=9' },
];

interface Category {
  id: number;
  name: string;
  products?: {
    imgurl: string | null;
  }[];
}

interface CategoriesSectionProps {
  categories?: Category[];
}

export default function CategoriesSection({ categories = [] }: CategoriesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <Badge className="mb-8 bg-green-100 text-green-800 px-8 py-2">
            Our Product Range
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            What We Sell
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our comprehensive range of high-quality products designed to meet 
            your irrigation, industrial, and agricultural needs.
          </p>
        </div>

        {/* Navigation Container */}
        <div className="relative">
          {/* Left Arrow */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Right Arrow */}
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide mx-16"
          >
            <div className="flex gap-8 pb-4" style={{ width: 'max-content' }}>
              {shopCategories.map((category, index) => {
                // Find matching category from database if available
                const dbCategory = categories?.find(cat => 
                  cat?.name?.toLowerCase()?.includes(category.name.toLowerCase())
                );
                const categoryImage = dbCategory?.products?.[0]?.imgurl;

                return (
                  <Card key={index} className="group relative overflow-hidden rounded-2xl border border-gray-200/40 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-black/10 hover:border-gray-300/60 p-0 w-48 flex-shrink-0">
                    <Link href={category.href} className="block">
                      {/* Large Image Container */}
                      <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-t-2xl">
                        {categoryImage ? (
                          <Image
                            src={categoryImage}
                            alt={category.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            <Package className="h-20 w-20 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Category Badge - Top Left */}
                        <Badge
                          variant="secondary"
                          className="absolute left-4 top-4 rounded-lg bg-white/90 text-xs font-medium text-gray-600 border-0 shadow-sm px-3 py-1"
                        >
                          Category
                        </Badge>
                      </div>
                    </Link>
                    
                    {/* Content Section */}
                    <div className="p-2 text-center space-y-0">
                      {/* Category Name */}
                      <div className="flex items-start justify-between gap-2">
                        <Link href={category.href} className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-gray-700 transition-colors min-h-[2.5rem] flex items-center">
                            {category.name}
                          </h3>
                        </Link>
                      </div>
                      
                      {/* View Products Button */}
                      <Link href={category.href}>
                        <Button 
                          variant="outline" 
                          className="w-full text-sm font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                        >
                          View Products
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}