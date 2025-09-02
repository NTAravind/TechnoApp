import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Leaf,
  Lightbulb,
  Users,
  Factory,
  Mail
} from 'lucide-react';
import { HeroSection } from './components/HomeClient';
import CategoriesSection from './components/categorySection';
import Link from 'next/link';
import { getCategories } from '@/lib/productActions';

export default async function Home() {
  const categories = await getCategories();
  
  const features = [
    {
      icon: <Leaf className="w-8 h-8 text-green-600" />,
      title: "Quality Assurance",
      description: "Every product meets the highest standards with rigorous quality controls and premium materials for lasting performance."
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-green-600" />,
      title: "Innovation and Sustainability", 
      description: "Cutting-edge solutions that conserve resources and promote eco-friendly practices across all our product lines."
    },
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      title: "Customer-Centric Approach",
      description: "Personalized solutions and dedicated support ensure your needs are met with exceptional service every time."
    },
    {
      icon: <Factory className="w-8 h-8 text-green-600" />,
      title: "Industry Expertise",
      description: "Years of experience in irrigation, food processing, and industrial cleaning bring unmatched knowledge to every project."
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* What We Sell Section */}
      <CategoriesSection categories={categories} />

      {/* Why Choose Us Bento Grid Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <Badge className="mb-8 bg-green-100 text-green-800 px-8 py-2">
              Why Choose Techno Industries
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              Built on Trust, Driven by Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From drip irrigation systems to pure cooking oils and powerful cleaning agents, 
              we deliver solutions that make a difference.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* First card - spans 2 columns on medium+ screens */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-green-300 bg-white rounded-2xl overflow-hidden md:col-span-2">
              <CardContent className="p-8 text-center h-full flex flex-col">
                <div className="mb-8 flex justify-center">
                  <div className="p-4 rounded-2xl bg-green-50 group-hover:bg-green-100 transition-colors">
                    {features[0].icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-6 group-hover:text-green-600 transition-colors">
                  {features[0].title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed flex-1">
                  {features[0].description}
                </p>
              </CardContent>
            </Card>

            {/* Second card - single column */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-green-300 bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-8 text-center h-full flex flex-col">
                <div className="mb-8 flex justify-center">
                  <div className="p-4 rounded-2xl bg-green-50 group-hover:bg-green-100 transition-colors">
                    {features[1].icon}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-6 group-hover:text-green-600 transition-colors">
                  {features[1].title}
                </h3>
                
                <p className="text-gray-600 text-sm leading-relaxed flex-1">
                  {features[1].description}
                </p>
              </CardContent>
            </Card>

            {/* Third card - single column */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-green-300 bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-8 text-center h-full flex flex-col">
                <div className="mb-8 flex justify-center">
                  <div className="p-4 rounded-2xl bg-green-50 group-hover:bg-green-100 transition-colors">
                    {features[2].icon}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-6 group-hover:text-green-600 transition-colors">
                  {features[2].title}
                </h3>
                
                <p className="text-gray-600 text-sm leading-relaxed flex-1">
                  {features[2].description}
                </p>
              </CardContent>
            </Card>

            {/* Fourth card - spans 2 columns on medium+ screens */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-green-300 bg-white rounded-2xl overflow-hidden md:col-span-2">
              <CardContent className="p-8 text-center h-full flex flex-col">
                <div className="mb-8 flex justify-center">
                  <div className="p-4 rounded-2xl bg-green-50 group-hover:bg-green-100 transition-colors">
                    {features[3].icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-6 group-hover:text-green-600 transition-colors">
                  {features[3].title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed flex-1">
                  {features[3].description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Single Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-3xl p-12 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-8">
                  Ready to Transform Your Operations?
                </h3>
                <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
                  Contact us today to discuss your irrigation, oil, or cleaning solution needs. 
                  Our experts are ready to help you find the perfect fit.
                </p>
                <Link href="/contact">
                  <Button 
                    size="lg" 
                    className="bg-white text-green-700 hover:bg-gray-50 h-16 px-8 font-medium"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Get In Touch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}