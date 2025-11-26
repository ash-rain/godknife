import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "GodKnife - Handmade Knives Marketplace",
  description: "Buy and sell premium handmade knives",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <SessionProvider>
          <LanguageProvider>
            <div className="flex-1">{children}</div>
            <Footer />
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
