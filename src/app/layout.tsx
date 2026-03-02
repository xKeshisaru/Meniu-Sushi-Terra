import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { CookieConsent } from "@/components/layout/CookieConsent";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sushi Terra - Meniu Digital",
  description: "Descoperă aromele autentice japoneze. Comandă acum!",
  generator: "Next.js",
  manifest: "/manifest.webmanifest", // Next.js automatically handles this with manifest.ts but explicit link doesn't hurt or can be removed if using manifest.ts
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="scroll-smooth dark" suppressHydrationWarning>
      <body className={`${outfit.className} bg-black antialiased`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
