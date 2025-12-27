import { CryptoLogoPreloader } from "@/components/CryptoLogoPreloader";
import { CryptoPolyfillSetup } from "@/components/CryptoPolyfillSetup";
import IntercomInitializer from "@/components/IntercomInitializer";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ROZO Intents - Multi-Chain USDC Transfer",
  description:
    "Transfer USDC across chains with Intent Pay - fast, secure, and decentralized",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <CryptoPolyfillSetup />
        <Suspense fallback={null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <CryptoLogoPreloader />
            <IntercomInitializer appId="kpfdpai7" />
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
