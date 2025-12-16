import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PWAInit } from "@/components/PWAInit";

// ⚡ OPTIMIZED: Font loading with display swap for better performance
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Prevent FOUT (Flash of Unstyled Text)
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Lazy load mono font (not critical)
  fallback: ['ui-monospace', 'monospace'],
});

export const metadata: Metadata = {
  title: "Hongson T-Folio",
  description: "ระบบแฟ้มสะสมผลงานและประเมินครู โรงเรียนหงส์สังข์สุพรรณบุรี",
  applicationName: "Hongson T-Folio",
  keywords: ["hongson", "teacher", "portfolio", "assessment", "education"],
  authors: [{ name: "สาธิต ศิริวัชน์" }],
  creator: "สาธิต ศิริวัชน์",
  
  icons: {
    icon: '/logo-hongson-mv.svg',
    apple: '/logo-hongson-metaverse.png',
  },
  
  // ⚡ PWA Metadata
  manifest: '/manifest.json',
  
  // Apple Web App
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'T-Folio',
  },
  
  // Microsoft
  other: {
    'msapplication-TileColor': '#4a9d7a',
    'msapplication-config': '/browserconfig.xml',
  },
};

// ⚡ Viewport Configuration (Next.js 16+ requires separate export)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4a9d7a' },
    { media: '(prefers-color-scheme: dark)', color: '#1a2e25' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWAInit />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
