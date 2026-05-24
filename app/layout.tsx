import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SisaRasa - Selamatkan Makanan, Hemat Pengeluaran",
  description:
    "Temukan makanan berkualitas dari UMKM lokal dengan harga lebih hemat sebelum terbuang.",
  manifest: "/manifest.json",
  applicationName: "SisaRasa",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SisaRasa",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="apple-touch-startup-image" href="/images/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
