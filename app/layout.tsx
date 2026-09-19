import type { Metadata } from "next";
import "./globals.css";
import { MerchantProvider } from "@/components/context/MerchantContext";

export const metadata: Metadata = {
  title: "Paytm Sentinel — Autonomous Economic Copilot",
  description: "AI-powered economic intelligence, margin leak detection, and experimental optimization for Paytm merchants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f8f9ff] text-[#0b1c30] font-sans">
        <MerchantProvider>
          {children}
        </MerchantProvider>
      </body>
    </html>
  );
}

