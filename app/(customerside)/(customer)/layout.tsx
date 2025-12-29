import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import { NavBar} from './components/products/Nav'
import Footer from "./components/Footer";
import NotificationSubscriptionPrompt from "./components/PushNotification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)

{
  return (
    <div className="bg-green-50">
      <SessionProvider>
      <NavBar />
   
   <main className="pb-20 lg:pb-0"> {/* Adds 20 units of padding-bottom on mobile, none on large screens */}
          {children}
        </main>
 
      <Footer />
      </SessionProvider>
     
    </div>
  );
}