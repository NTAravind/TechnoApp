'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, CheckCircle2, Loader2, Smartphone } from 'lucide-react';

export default function AppDownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installComplete, setInstallComplete] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [downloadCount, setDownloadCount] = useState(1247);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture the beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setInstallComplete(true);
      setIsInstalled(true);
      setDownloadCount(prev => prev + 1);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support PWA or already installed
      alert('App is already installed or your browser doesn\'t support installation. You can add this page to your home screen manually.');
      return;
    }

    setIsInstalling(true);

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallComplete(true);
      setDownloadCount(prev => prev + 1);
    }

    setIsInstalling(false);
    setDeferredPrompt(null);
  };

  const handleAPKDownload = () => {
    // Fallback APK download for devices that can't use PWA
    const link = document.createElement('a');
    link.href = '/Techno Industries.apk';
    link.download = 'TechnoApp.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'oklch(1.0000 0 0)',
      color: 'oklch(0.1469 0.0041 49.2499)'
    }}>
      <div className="max-w-md w-full space-y-8">
        {/* Logo placeholder */}
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{
            background: 'oklch(0.9250 0.0806 155.9947)',
            border: '2px solid oklch(0.7227 0.1920 149.5793)'
          }}>
            <Smartphone className="w-16 h-16" style={{ color: 'oklch(0.7227 0.1920 149.5793)' }} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold" style={{ color: 'oklch(0.1469 0.0041 49.2499)' }}>
            Techno Premium Quality
          </h1>
          <p className="text-lg" style={{ color: 'oklch(0.5555 0 0)' }}>
            Install now on any device
          </p>
        </div>

        {/* Install Card */}
        <Card style={{ 
          background: 'oklch(0.9940 0 0)',
          borderColor: 'oklch(0.9250 0.0806 155.9947)'
        }}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isInstalled ? 'App Installed!' : 'Install App'}
            </CardTitle>
            <CardDescription style={{ color: 'oklch(0.5555 0 0)' }}>
              {isInstalled 
                ? 'Open from your home screen' 
                : 'One-tap installation, no store needed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {installComplete && !isInstalled && (
              <Alert style={{ 
                background: 'oklch(0.9250 0.0806 155.9947)',
                borderColor: 'oklch(0.7227 0.1920 149.5793)'
              }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.7227 0.1920 149.5793)' }} />
                <AlertDescription style={{ color: 'oklch(0.3925 0.0896 152.5353)' }}>
                  <strong>Installation Complete!</strong>
                  <p className="mt-1 text-sm">Find the app icon on your home screen or app drawer.</p>
                </AlertDescription>
              </Alert>
            )}

            {isInstalled && (
              <Alert style={{ 
                background: 'oklch(0.9250 0.0806 155.9947)',
                borderColor: 'oklch(0.7227 0.1920 149.5793)'
              }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.7227 0.1920 149.5793)' }} />
                <AlertDescription style={{ color: 'oklch(0.3925 0.0896 152.5353)' }}>
                  <strong>Already Installed!</strong>
                  <p className="mt-1 text-sm">You're currently using the installed version.</p>
                </AlertDescription>
              </Alert>
            )}
            
            {!isInstalled && (
              <Button 
                className="w-full text-lg py-6"
                style={{
                  background: 'oklch(0.7227 0.1920 149.5793)',
                  color: 'oklch(0.9819 0.0181 155.8263)'
                }}
                onClick={handleInstall}
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                  </>
                )}
              </Button>
            )}

            <div className="text-center">
              <button
                onClick={handleAPKDownload}
                className="text-sm underline"
                style={{ color: 'oklch(0.5555 0 0)' }}
              >
                Or download APK file instead
              </button>
            </div>
            
            <div className="flex justify-between items-center text-sm" style={{ color: 'oklch(0.5555 0 0)' }}>
              <p>Version 1.0.0</p>
              <p>•</p>
              <p>All Devices</p>
              <p>•</p>
              <p>{downloadCount.toLocaleString()} installs</p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-center space-y-2 text-sm" style={{ color: 'oklch(0.5555 0 0)' }}>
          <p>✓ Works offline</p>
          <p>✓ Fast and lightweight</p>
          <p>✓ No app store required</p>
        </div>
      </div>
    </div>
  );
}