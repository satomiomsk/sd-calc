import type React from "react"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { ErrorReporter, ConsoleReporter, ReactErrorBoundary } from "@/components/error-reporter"

const inter = localFont({ src: "../public/fonts/InterVariable.woff2", display: "swap", weight: "100 900" });

export const metadata: Metadata = {
  title: "SD | Расчёты",
  description: "Удобный расчёт агентского вознаграждения при покупке и продаже недвижимости",
  icons: { icon: "/favicon.png?v=sd-calculator-1" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SD | Расчёты", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#E83C35",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} antialiased [touch-action:pan-x_pan-y]`}>
        <ReactErrorBoundary>
          {children}
        </ReactErrorBoundary>
        <Toaster />
        <ErrorReporter />
        <ConsoleReporter />
      </body>
    </html>
  );
}
