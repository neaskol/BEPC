import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { SyncProvider } from "@/components/ui/SyncProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BEPC Mada — Prépare ton BEPC",
  description:
    "Application d'aide à la préparation du BEPC pour les élèves malgaches. Cours, exercices, flashcards et examens blancs.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BEPC Mada",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#639922",
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
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
        <SyncProvider>
          <OfflineBanner />
          {children}
        </SyncProvider>
      </body>
    </html>
  );
}
