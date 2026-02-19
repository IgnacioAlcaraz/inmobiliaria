import type { Metadata } from 'next'
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'

import './globals.css'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RE/MAX CRM - Gestión Comercial',
  description: 'Sistema de gestión comercial inmobiliaria para equipos RE/MAX',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
