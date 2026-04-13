import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Techno Industries",
  description: "Techno Industries - One stop solution for all your Agricultural needs.",
  keywords: ["agriculture", "farming", "agricultural solutions", "techno industries", "android app"],
  authors: [{ name: "Techno Industries" }],
  creator: "Techno Industries",
  publisher: "Techno Industries",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "Techno Industries",
    "theme-color": "#22c55e",
    // Force fullscreen standalone mode
    "display": "standalone",
    // TWA specific
    "twa-fallback-strategy": "customtabs",
    "msapplication-navbutton-color": "#22c55e",
    "msapplication-TileColor": "#22c55e",
    "msapplication-TileImage": "/icon/android-chrome-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#22c55e" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Android PWA specific meta tags for hiding address bar */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="color-scheme" content="light dark" />
        <meta name="display" content="standalone" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 overflow-x-hidden`}
      >
        
          <div className="flex-grow flex flex-col">
            <main className="flex-grow relative">
              {children}
            </main>
          </div>
          
        
      </body>
    </html>
  );
}