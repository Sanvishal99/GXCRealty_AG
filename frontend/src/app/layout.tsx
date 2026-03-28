import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { AppConfigProvider } from '@/context/AppConfigContext'
import { UserProfileProvider } from '@/context/UserProfileContext'
import ToastContainer from '@/components/ToastContainer'

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
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans min-h-screen selection:bg-indigo-500/30`}>
        <AppConfigProvider>
          <UserProfileProvider>
            <ThemeProvider>
              <CurrencyProvider>
                <NotificationProvider>
                  {children}
                  <ToastContainer />
                </NotificationProvider>
              </CurrencyProvider>
            </ThemeProvider>
          </UserProfileProvider>
        </AppConfigProvider>
      </body>
    </html>
  )
}
