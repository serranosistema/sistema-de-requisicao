import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/lib/store";
import { PWAUpdater } from "@/components/pwa-updater";
import { Toaster } from "sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Requisição Digital de Insumos",
  description:
    "Sistema de requisição de insumos para operação interna de varejo e alimentação",
  manifest: "/manifest.json?v=1", // Cache Busting ativado!
  icons: {
    icon: [
      {
        url: "/favicon-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
      {
        url: "/android-chrome-192x192.png",
        type: "image/png",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <PWAUpdater />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Deixe o children apenas AQUI dentro do StoreProvider */}
          <StoreProvider>{children}</StoreProvider>
        </ThemeProvider>

        <Toaster />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
