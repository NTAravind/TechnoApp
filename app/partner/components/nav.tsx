'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Package, ShoppingCart, LogOut, User, Home, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PartnerDock({ session }: { session: any }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/partner', label: 'Dashboard', icon: Home },
    { href: '/partner/products', label: 'Products', icon: Package },
    { href: '/partner/orders', label: 'Orders', icon: ShoppingCart },
  ]

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
      <div className="rounded-2xl border bg-background/95 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/partner" className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Techno Logo" width={48} height={48} className="rounded-md object-cover" />
              <span className="font-bold text-lg hidden sm:block">Partner Portal</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden sm:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right: User & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {session.user?.name || session.user?.username || 'Partner'}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/partner/login' })}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile Bottom Nav (only visible on small screens) */}
        <div className="sm:hidden flex justify-around border-t pt-3 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}