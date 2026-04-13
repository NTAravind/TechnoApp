'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, Package, Droplets, Wrench, Globe, Smartphone } from 'lucide-react';

export default function AppDownloadPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [installComplete, setInstallComplete] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  React.useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture PWA install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstallComplete(true);
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) {
      alert('App is already installed or your browser doesn\'t support PWA installation.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallComplete(true);
    }
    setDeferredPrompt(null);
  };

  const handleAPKDownload = () => {
    setIsDownloading(true);
    setDownloadComplete(false);
    
    // Trigger APK download immediately
    const link = document.createElement('a');
    link.href = '/Techno Industries.apk';
    link.download = 'TechnoIndustries.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show completion message
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadComplete(true);
    }, 1000);
  };

  const features = [
    { icon: Droplets, title: 'Drip Irrigation', desc: 'Complete range of laterals & systems' },
    { icon: Package, title: 'PVC Pipes', desc: 'Premium quality pipes & fittings' },
    { icon: Wrench, title: 'Fast Delivery', desc: 'Quick shipping across Karnataka' }
  ];

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'oklch(1.0000 0 0)',
        color: 'oklch(0.1469 0.0041 49.2499)'
      }}
    >
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div 
                className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                style={{ 
                  background: 'oklch(0.9250 0.0806 155.9947)',
                  color: 'oklch(0.3925 0.0896 152.5353)'
                }}
              >
                Mobile App Available
              </div>
              
              <h1 
                className="font-bold leading-tight"
                style={{
                  fontSize: '42px',
                  color: 'oklch(0.1469 0.0041 49.2499)',
                  lineHeight: 1.2
                }}
              >
                Shop Irrigation & Plumbing Essentials{' '}
                <span style={{ color: 'oklch(0.7227 0.1920 149.5793)' }}>
                  with Ease
                </span>
              </h1>
              
              <p 
                className="text-lg"
                style={{
                  color: 'oklch(0.5555 0 0)',
                  lineHeight: 1.6
                }}
              >
                Buy drip laterals, PVC pipes, fittings, and more. Experience fast delivery and premium quality products across Karnataka.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <Card 
                  key={idx}
                  style={{ 
                    background: 'oklch(1.0000 0 0)',
                    borderColor: 'oklch(0.9250 0.0806 155.9947)'
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <feature.icon 
                      className="w-8 h-8 mx-auto mb-2" 
                      style={{ color: 'oklch(0.7227 0.1920 149.5793)' }} 
                    />
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs" style={{ color: 'oklch(0.5555 0 0)' }}>
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Download Section */}
            <div className="space-y-4">
              {downloadComplete && (
                <Alert 
                  style={{ 
                    background: 'oklch(0.9250 0.0806 155.9947)',
                    borderColor: 'oklch(0.7227 0.1920 149.5793)'
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.7227 0.1920 149.5793)' }} />
                  <AlertDescription style={{ color: 'oklch(0.3925 0.0896 152.5353)' }}>
                    <strong>Download Complete!</strong>
                    <div className="mt-2 text-xs space-y-1">
                      <p>1. Open notification bar and tap the APK</p>
                      <p>2. Enable "Install from Unknown Sources" if prompted</p>
                      <p>3. Tap "Install" to complete</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {installComplete && !isInstalled && (
                <Alert 
                  style={{ 
                    background: 'oklch(0.9250 0.0806 155.9947)',
                    borderColor: 'oklch(0.7227 0.1920 149.5793)'
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.7227 0.1920 149.5793)' }} />
                  <AlertDescription style={{ color: 'oklch(0.3925 0.0896 152.5353)' }}>
                    <strong>App Installed!</strong>
                    <p className="mt-1 text-xs">Find the app icon on your home screen.</p>
                  </AlertDescription>
                </Alert>
              )}

              {isInstalled && (
                <Alert 
                  style={{ 
                    background: 'oklch(0.9250 0.0806 155.9947)',
                    borderColor: 'oklch(0.7227 0.1920 149.5793)'
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.7227 0.1920 149.5793)' }} />
                  <AlertDescription style={{ color: 'oklch(0.3925 0.0896 152.5353)' }}>
                    <strong>Already Installed!</strong>
                    <p className="mt-1 text-xs">You're using the installed version.</p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="text-lg font-semibold flex-1"
                  size="lg"
                  style={{
                    backgroundColor: 'oklch(0.7227 0.1920 149.5793)',
                    color: 'oklch(0.9819 0.0181 155.8263)',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: '18px'
                  }}
                  onClick={handlePWAInstall}
                  disabled={!deferredPrompt || isInstalled}
                >
                  <Globe className="mr-2 h-6 w-6" />
                  Instant Install
                </Button>

                <Button 
                  className="text-lg font-semibold flex-1"
                  size="lg"
                  style={{
                    backgroundColor: 'oklch(0.7227 0.1920 149.5793)',
                    color: 'oklch(0.9819 0.0181 155.8263)',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: '18px'
                  }}
                  onClick={handleAPKDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-6 w-6" />
                      Download for Android
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm" style={{ color: 'oklch(0.5555 0 0)' }}>
                Free download • Android 8.0+ • 5 MB
              </p>
            </div>
          </div>

          {/* Right Column - App Preview */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Decorative background */}
              <div 
                className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
                style={{ background: 'oklch(0.7227 0.1920 149.5793)' }}
              />
              
              {/* Phone mockup */}
              <div 
                className="relative overflow-hidden"
                style={{
                  width: '320px',
                  height: '640px',
                  backgroundColor: 'oklch(0.1469 0.0041 49.2499)',
                  borderRadius: '40px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                  padding: '12px'
                }}
              >
                <div 
                  className="w-full h-full rounded-3xl overflow-hidden"
                  style={{
                    background: 'oklch(0.9250 0.0806 155.9947)'
                  }}
                >
                  <img 
                    src="/app_preview.png" 
                    alt="App Preview"
                    className="w-full h-full object-fill"
                  />
                  <div 
                    className="w-full h-full items-center justify-center text-center px-6" 
                    style={{ color: 'oklch(0.5555 0 0)', display: 'none' }}
                  >
                    <div>
                      <Package className="w-16 h-16 mx-auto mb-4" style={{ color: 'oklch(0.7227 0.1920 149.5793)' }} />
                      <p className="font-semibold mb-2">App Preview</p>
                      <p className="text-xs">Place app_preview.png in /public folder</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="mt-20 pt-8 text-center border-t"
          style={{ borderColor: 'oklch(0.9250 0.0806 155.9947)' }}
        >
          <p 
            className="text-sm leading-relaxed max-w-3xl mx-auto"
            style={{ color: 'oklch(0.5555 0 0)' }}
          >
            <span className="font-semibold" style={{ color: 'oklch(0.3925 0.0896 152.5353)' }}>
              Techno Industries
            </span>
            <br />
            Plot No S2, Industrial Area, Hosadurga, Chitradurga District, Karnataka – 577527
            <br />
            GSTIN: 29AVFPB5072K1ZF
          </p>
        </div>
      </div>
    </div>
  );
}