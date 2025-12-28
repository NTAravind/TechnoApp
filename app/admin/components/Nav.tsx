'use client';

import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  FolderOpen,
  Home,
  Bell,
  Handshake
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href: string;
}

const NavigationDock = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/admin' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
    { id: 'products', label: 'Products', icon: Package, href: '/admin/products' },
    { id: 'categories', label: 'Categories', icon: FolderOpen, href: '/admin/categories' },
    { id: 'customers', label: 'Customers', icon: Users, href: '/admin/customers' },
    { id: 'partner', label: 'Partners', icon: Handshake, href: '/admin/partner' },
        { id: 'notification', label: 'notifications', icon: Bell, href: '/admin/notification' },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-2  bg-green-600 backdrop-blur-md border rounded-full px-4 py-3 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
                          (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200
                ${isActive 
                  ? 'bg-white dark:bg-green-800 text-primary dark:text-green-100 shadow-sm' 
                  : 'hover:bg-white/20 dark:hover:bg-green-700/20 text-primary-foreground dark:text-green-100 hover:text-white'
                }
              `}
            >
              <Icon size={18} />
              <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NavigationDock;