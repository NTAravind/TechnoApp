import { ReactNode } from 'react'


export const metadata = {
  title: 'My E-Commerce App',
  description: 'Discover a wide range of quality products',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
   <div >
    {children}
   </div>
  )
}