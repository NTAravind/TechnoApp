import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import PartnerNav from './components/nav'
import { SessionProvider } from 'next-auth/react'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  // Check if we're on the login page by checking if children contains login page
  // Since this is a server component, we need a different approach
  // The middleware already handles auth, so we only need to show nav for authenticated users
  
  const isAuthenticated = session && session.user?.role === 'partner'

  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-50">
        {isAuthenticated && <PartnerNav session={session} />}
        <main className={isAuthenticated ? "container mx-auto py-6 px-4" : ""}>
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}