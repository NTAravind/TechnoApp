import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, MessageCircle } from 'lucide-react';
import logo from '@/public/logo.svg'
import Image from 'next/image';
export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-green-900 to-green-800 text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-700 rounded-full mix-blend-multiply opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-800 rounded-full mix-blend-multiply opacity-20 blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
            <Image src={logo} alt='Techno' width={70} height={70}/>
              <div className="text-xl font-medium bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                Techno<span className="font-light">Industries</span>
              </div>
            </div>
            <p className="text-green-200 text-sm">
              Leading the future of technology with innovative solutions and cutting-edge industrial expertise.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link href="https://wa.link/myi5tn" target="_blank" rel="noopener noreferrer" className="text-green-200 hover:text-white transition-colors duration-200 hover:scale-110 transform">
                <MessageCircle size={20} className="hover:drop-shadow-glow" />
              </Link>
              <Link href="#" className="text-green-200 hover:text-white transition-colors duration-200 hover:scale-110 transform">
                <Instagram size={20} className="hover:drop-shadow-glow" />
              </Link>
              <Link href="#" className="text-green-200 hover:text-white transition-colors duration-200 hover:scale-110 transform">
                <Facebook size={20} className="hover:drop-shadow-glow" />
              </Link>
              <Link href="#" className="text-green-200 hover:text-white transition-colors duration-200 hover:scale-110 transform">
                <Twitter size={20} className="hover:drop-shadow-glow" />
              </Link>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-start space-x-3 text-sm text-green-200">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <div>
                  <p>Q7WC+829, Hosadurga</p>
                  <p>Karnataka 577527</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm text-green-200">
                <Mail size={16} />
                <span>technoindustriesonline@gmail.com</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Products
                </Link>
              </li>
              <li>
                <Link href="/investor" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Investor
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Business</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/investor" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Investor Relations
                </Link>
              </li>
              <li>
                <Link href="/partnerships" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Partnerships
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/innovation" className="text-green-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Innovation Hub
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-green-800/50 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-green-300">© 2025 Techno Industries. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="/privacy-policy" className="text-xs text-green-300 hover:text-white transition-colors duration-200">Privacy</Link>
            <Link href="/terms" className="text-xs text-green-300 hover:text-white transition-colors duration-200">Terms</Link>
            <Link href="/sitemap" className="text-xs text-green-300 hover:text-white transition-colors duration-200">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}