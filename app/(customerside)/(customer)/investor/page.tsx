'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Factory, Droplets, ChefHat, Recycle, Palette, Building, TrendingUp } from 'lucide-react'

export default function TechnoIndustriesPage() {
  const services = [
    {
      icon: Droplets,
      title: "Drip Irrigation",
      description: "Advanced water management solutions"
    },
    {
      icon: ChefHat,
      title: "Cooking Oil",
      description: "Premium quality food-grade oils"
    },
    {
      icon: Recycle,
      title: "Plastic Recycling",
      description: "Sustainable recycling solutions"
    },
    {
      icon: Palette,
      title: "Paint Solvents",
      description: "Industrial-grade mixing solutions"
    }
  ]

  const handleCall = () => {
    window.location.href = 'tel:+919945631341'
  }

  return (
    <div className="min-h-screen  text-[#0c0a09]">
      <div className="container mx-auto px-6 py-16">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-7xl mx-auto">
          
          {/* Hero Section - Large */}
          <Card className="md:col-span-4 lg:col-span-5 md:row-span-2 bg-[#fdfdfd] border-[#f5f5f5] p-8 flex flex-col justify-center min-h-[320px]">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center">
                  <Factory className="w-6 h-6 text-[#22c55e]" />
                </div>
                <Badge className="bg-[#bbf7d0] text-[#14532d] border-0">Industrial Leader</Badge>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-[#0c0a09] leading-tight">
                  Techno<br />Industries
                </h1>
                <p className="text-xl text-[#737373] max-w-md leading-relaxed">
                  Leading manufacturer of industrial solutions across multiple sectors
                </p>
              </div>
              
              <Button 
                onClick={handleCall} 
                size="lg" 
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white w-fit px-8"
              >
                <Phone className="w-4 h-4 mr-2" />
                +91 9945631341
              </Button>
            </div>
          </Card>

          {/* Investment Card */}
          <Card className="md:col-span-2 lg:col-span-3 bg-[#fdfdfd] border-[#22c55e]/20 p-6">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#22c55e]/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#22c55e]" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-[#0c0a09] mb-2">
                  Investment Opportunity
                </h3>
                <p className="text-[#737373] text-sm">
                  Join our growth in sustainable industrial solutions
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/5"
              >
                Learn More
              </Button>
            </div>
          </Card>

          {/* Contact Card */}
          <Card className="md:col-span-2 lg:col-span-3 bg-[#fdfdfd] border-[#f5f5f5] p-6">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#22c55e]" />
                <span className="font-semibold text-[#0c0a09]">Contact</span>
              </div>
              
              <div className="flex-1">
                <p className="text-2xl font-bold text-[#0c0a09] mb-1">+91 9945631341</p>
                <p className="text-[#737373] text-sm">Ready to discuss your needs?</p>
              </div>
              
              <Button 
                onClick={handleCall} 
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white"
              >
                Call Now
              </Button>
            </div>
          </Card>

          {/* Service Cards - 2x2 Grid */}
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="md:col-span-1 lg:col-span-2 bg-[#fdfdfd] border-[#f5f5f5] p-6 group hover:border-[#22c55e]/30 hover:bg-[#22c55e]/5 transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-4 h-full flex flex-col">
                <div className="w-12 h-12 bg-[#fcfcfc] rounded-2xl flex items-center justify-center group-hover:bg-[#22c55e]/10 transition-colors">
                  <service.icon className="w-6 h-6 text-[#737373] group-hover:text-[#22c55e] transition-colors" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0c0a09] mb-2 leading-tight">
                    {service.title}
                  </h3>
                  <p className="text-[#737373] text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {/* About Section - Full Width */}
          <Card className="md:col-span-6 lg:col-span-8 bg-[#fdfdfd] border-[#f5f5f5] p-8">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Building className="w-6 h-6 text-[#22c55e]" />
                <h2 className="text-2xl font-bold text-[#0c0a09]">About Techno Industries</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <h4 className="font-semibold text-[#0c0a09]">Our Mission</h4>
                  <p className="text-[#737373] text-sm leading-relaxed">
                    Delivering innovative industrial solutions that drive efficiency and sustainability across diverse sectors.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-[#0c0a09]">Industries Served</h4>
                  <p className="text-[#737373] text-sm leading-relaxed">
                    Agriculture, Food Processing, Manufacturing, Chemical Processing, and Environmental Services.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-[#0c0a09]">Quality Commitment</h4>
                  <p className="text-[#737373] text-sm leading-relaxed">
                    Premium quality products backed by reliable service and technical expertise.
                  </p>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}