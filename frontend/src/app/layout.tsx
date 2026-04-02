import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { AppConfigProvider } from '@/context/AppConfigContext'
import { UserProfileProvider } from '@/context/UserProfileContext'
import { PropertyProvider } from '@/context/PropertyContext'
import { LogProvider } from '@/context/LogContext'
import ToastContainer from '@/components/ToastContainer'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import PWARegister from '@/components/PWARegister'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const viewport: Viewport = {
  themeColor: '#B8860B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gxcreality.com'),
  title: 'GXC Realty | Exclusive Network',
  description: 'Invite-only real estate platform and premium incentive engine',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GXC Realty',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/favicon.png',
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans min-h-screen selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-500`} suppressHydrationWarning>
        <AppConfigProvider>
          <UserProfileProvider>
            <PropertyProvider>
              <ThemeProvider>
                <CurrencyProvider>
                  <NotificationProvider>
                    <LogProvider>
                      <PWARegister />
                      <ImpersonationBanner />
                      {children}
                      <ToastContainer />
                    </LogProvider>
                  </NotificationProvider>
                </CurrencyProvider>
              </ThemeProvider>
            </PropertyProvider>
          </UserProfileProvider>
        </AppConfigProvider>
      </body>
    </html>
  )
}
