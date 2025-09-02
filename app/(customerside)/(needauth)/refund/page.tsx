'use client'
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function RefundPage() {
  const handleWhatsAppClick = () => {
    window.open('https://wa.link/132fuh', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Request a Refund
        </h1>
        <p className="text-slate-500">
          We are here to help with your refund request. Follow the simple steps below.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Main refund process card */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Request a Refund
            </CardTitle>
            <CardDescription>
              Follow these 3 simple steps to process your refund request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-lg px-3 py-1">
                  1
                </Badge>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Get Your Order ID</h3>
                <p className="text-slate-600 mb-3">
                  Visit your orders page and copy the Order ID of the item you want to return.
                </p>
                <Link href="/orders">
                  <Button variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    View My Orders
                  </Button>
                </Link>
              </div>
            </div>

            <Separator className="bg-slate-200" />

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-lg px-3 py-1">
                  2
                </Badge>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Contact Us on WhatsApp</h3>
                <p className="text-slate-600 mb-3">
                  Message us directly on WhatsApp with your refund request. Our support team will assist you promptly.
                </p>
                <Button 
                  onClick={handleWhatsAppClick}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382"/>
                  </svg>
                  Message on WhatsApp
                </Button>
              </div>
            </div>

            <Separator className="bg-slate-200" />

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-300 text-lg px-3 py-1">
                  3
                </Badge>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Provide Order Details</h3>
                <p className="text-slate-600 mb-3">
                  Share your Order ID and reason for return. Our team will guide you through the next steps.
                </p>
                <Alert className="bg-green-50 border-green-200">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <AlertDescription className="text-green-800">
                    <strong>Tip:</strong> Have your Order ID ready before messaging us for faster processing.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund policy card */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Refund Policy
            </CardTitle>
            <CardDescription>
              Important information about our refund process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700">✅ Eligible for Refund</h4>
                <ul className="text-sm text-slate-600 space-y-1 pl-4">
                  <li>• Damaged or defective items</li>
                  <li>• Wrong item delivered</li>
                  <li>• Items not as described</li>
                  <li>• Quality issues</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-red-600">❌ Not Eligible</h4>
                <ul className="text-sm text-slate-600 space-y-1 pl-4">
                  <li>• Change of mind after use</li>
                  <li>• Items used extensively</li>
                  <li>• Custom/personalized items</li>
                  <li>• Items returned after 30 days</li>
                </ul>
              </div>
            </div>
            
            <Alert className="bg-green-50 border-green-200">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <AlertDescription className="text-green-800">
                <strong>Processing Time:</strong> Refunds are typically processed within 5-7 business days after approval.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Quick contact card */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-center text-slate-900">Need Immediate Help?</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Our customer support team is ready to assist you
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center gap-4">
              <Button 
                onClick={handleWhatsAppClick}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382"/>
                </svg>
                Chat on WhatsApp
              </Button>
              <Link href="/orders">
                <Button variant="outline" size="lg" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  View Orders
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              Response time: Usually within 30 minutes during business hours
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}