// src/app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { APP_INFO } from '@/config'
import { Layout } from '@/components'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import '@/styles/globals.css'

import { Geist, Geist_Mono } from 'next/font/google'
import GoogleMapsProvider from './providers/GoogleMapsProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='ko'>
      <body className={`antialiased ${geistSans.variable} ${geistMono.variable}`}>
        <GoogleMapsProvider>
          <Layout>{children}</Layout>
        </GoogleMapsProvider>
      </body>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID || ''} />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
    </html>
  )
}

export const metadata: Metadata = {
  alternates: {
    canonical: APP_INFO.url,
  },
  title: {
    default: APP_INFO.title,
    template: APP_INFO.titleTemplate,
  },
  description: APP_INFO.description,
  keywords: APP_INFO.keywords,
  authors: APP_INFO.authors,
  creator: APP_INFO.authors[0].name,
  publisher: APP_INFO.authors[0].name,
  manifest: '/manifest.json',
  generator: APP_INFO.authors[0].name,
  applicationName: APP_INFO.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_INFO.title,
    // startUpImage: [],
  },
  metadataBase: new URL(APP_INFO.url),
  category: 'webapp',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_INFO.name,
    title: {
      default: APP_INFO.title,
      template: APP_INFO.titleTemplate,
    },
    description: APP_INFO.description,
    locale: 'ko_KR',
    url: new URL(APP_INFO.url),
    images: {
      url: '/icons/op-image.png',
    },
  },
  verification: {
    google: APP_INFO.google_site_verification,
  },
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32' },
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32' },
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: {
      rel: 'mask-icon',
      url: '/icons/safari-pinned-tab.svg',
      color: '#000000',
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  themeColor: '#000000',
  userScalable: false,
  viewportFit: 'cover',
}
