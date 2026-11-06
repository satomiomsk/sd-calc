import type React from "react"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { ErrorReporter, ConsoleReporter, ReactErrorBoundary } from "@/components/error-reporter"

const inter = localFont({ src: "../public/fonts/InterVariable.woff2", display: "swap", weight: "100 900" });

const publicAsset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://sdcalc55.github.io/"),
  title: "SD | Расчёты",
  description: "Расчёт агентского вознаграждения и кредитный калькулятор",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://sdcalc55.github.io/",
    siteName: "SD | Расчёты",
    title: "SD | Расчёты",
    description: "Расчёт агентского вознаграждения и кредитный калькулятор",
    images: [{
      url: "https://sdcalc55.github.io/og-preview-128.png?v=8",
      width: 128,
      height: 128,
      alt: "SD — калькулятор расчётов",
    }],
  },
  twitter: {
    card: "summary",
    title: "SD | Расчёты",
    description: "Расчёт агентского вознаграждения и кредитный калькулятор",
    images: ["https://sdcalc55.github.io/og-preview-128.png?v=8"],
  },
  icons: { icon: publicAsset("/favicon.png?v=sd-calculator-1") },
  manifest: publicAsset("/manifest.webmanifest"),
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
