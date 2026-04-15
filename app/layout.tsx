import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0e7490',
};

export const metadata: Metadata = {
  title: "Aguas Continental | Gestión PYME",
  description: "Panel simple y visual para organizar ventas, clientes y cobranza.",
  manifest: '/manifest.webmanifest',
  applicationName: 'Aguas Continental',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Aguas Continental',
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    apple: '/apple-icon',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
