'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, CheckCircle2, Loader2 } from 'lucide-react';

export default function AppDownloadPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadCount, setDownloadCount] = useState(1247);

  const handleDownload = () => {
    setIsDownloading(true);
    setDownloadComplete(false);
    
    // Simulate download initiation
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadComplete(true);
      setDownloadCount(prev => prev + 1);
      
      // Create a download link for APK file
      // Replace 'your-app.apk' with your actual APK file path
      const link = document.createElement('a');
      link.href = '/Techno Industries.apk'; // Update this path to your APK location
      link.download = 'TechnoApp.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1000);
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
            <span className="text-sm" style={{ color: 'oklch(0.5555 0 0)' }}>Logo Here</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold" style={{ color: 'oklch(0.1469 0.0041 49.2499)' }}>
            Techno Premium Quality
          </h1>
          <p className="text-lg" style={{ color: 'oklch(0.5555 0 0)' }}>
            Available now on Android
          </p>
        </div>

        {/* Download Card */}
        <Card style={{ 
          background: 'oklch(0.9940 0 0)',
          borderColor: 'oklch(0.9250 0.0806 155.9947)'
        }}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Download for Android</CardTitle>
            <CardDescription style={{ color: 'oklch(0.5555 0 0)' }}>
              Get the app from Google Play
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {downloadComplete && (
              <Alert style={{ 
                background: 'oklch(0.9250 0.0806 155.9947)',
                borderColor: 'oklch(0.7227 0.1920 149.5793)'
              }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.7227 0.1920 149.5793)' }} />
                <AlertDescription style={{ color: 'oklch(0.3925 0.0896 152.5353)' }}>
                  Download started! Check your downloads folder.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              className="w-full text-lg py-6"
              style={{
                background: 'oklch(0.7227 0.1920 149.5793)',
                color: 'oklch(0.9819 0.0181 155.8263)'
              }}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Download Now
                </>
              )}
            </Button>
            
            <div className="flex justify-between items-center text-sm" style={{ color: 'oklch(0.5555 0 0)' }}>
              <p>Version 1.0.0</p>
              <p>•</p>
              <p>Android 8.0+</p>
              <p>•</p>
              <p>{downloadCount.toLocaleString()} downloads</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}