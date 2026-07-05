import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'LibyShop - منصة المتاجر الليبية',
    template: '%s | LibyShop',
  },
  description: 'أنشئ متجرك الإلكتروني في دقائق. منصة LibyShop تتيح للتجار الليبيين إنشاء متاجرهم الخاصة بسهولة وسرعة.',
  keywords: [
    'متجر إلكتروني',
    'ليبيا',
    'تجارة',
    'LibyShop',
    'e-commerce',
    ' Libya',
    'متاجر',
    'تسوق',
    'بيع أونلاين',
    'منصة تجارية',
  ],
  authors: [{ name: 'LibyShop', url: 'https://libyshop.vercel.app' }],
  creator: 'LibyShop Team',
  publisher: 'LibyShop',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_LY',
    url: 'https://libyshop.vercel.app',
    siteName: 'LibyShop',
    title: 'LibyShop - منصة المتاجر الليبية',
    description: 'أنشئ متجرك الإلكتروني في دقائق',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LibyShop - منصة المتاجر الليبية',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LibyShop - منصة المتاجر الليبية',
    description: 'أنشئ متجرك الإلكتروني في دقائق',
    images: ['/og-image.jpg'],
    creator: '@libyshop',
  },
  alternates: {
    canonical: 'https://libyshop.vercel.app',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'ecommerce',
  classification: 'Business',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
    { media: '(prefers-color-scheme: light)', color: '#0A0A0A' },
  ],
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LibyShop" />
        <meta name="application-name" content="LibyShop" />
        <meta name="msapplication-TileColor" content="#0A0A0A" />
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-cairo antialiased min-h-screen bg-dark text-white overflow-x-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-glow-top-right" />
          <div className="absolute inset-0 bg-glow-bottom-left" />
          <div className="absolute inset-0 bg-grid opacity-50" />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={12}
          containerClassName=""
          containerStyle={{
            top: 20,
            zIndex: 9999,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111827',
              color: '#FFFFFF',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              direction: 'rtl',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              maxWidth: '400px',
            },
            success: {
              duration: 3500,
              style: {
                borderLeft: '4px solid #10B981',
                borderRight: 'none',
              },
              iconTheme: {
                primary: '#10B981',
                secondary: '#111827',
              },
            },
            error: {
              duration: 5000,
              style: {
                borderLeft: '4px solid #EF4444',
                borderRight: 'none',
              },
              iconTheme: {
                primary: '#EF4444',
                secondary: '#111827',
              },
            },
            loading: {
              duration: Infinity,
              style: {
                borderLeft: '4px solid #C5A059',
                borderRight: 'none',
              },
              iconTheme: {
                primary: '#C5A059',
                secondary: '#111827',
              },
            },
            custom: {
              duration: 4000,
            },
          }}
        />
      </body>
    </html>
  );
}
