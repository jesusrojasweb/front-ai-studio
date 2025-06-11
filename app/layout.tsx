import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import LayoutProvider from '@/app/layout-provider'
import ClientAuthProvider from '@/components/ClientAuthProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'AI Studio - Create and manage video clips',
  description: 'AI-powered video clip creation and management platform'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LayoutProvider>
          <ClientAuthProvider>{children}</ClientAuthProvider>
        </LayoutProvider>
      </body>
    </html>
  )
}
