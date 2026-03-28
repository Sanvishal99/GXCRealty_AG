import type { Metadata } from 'next'
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

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'GXCRealty | Exclusive Network',
  description: 'Invite-only real estate platform and premium commission engine',
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
