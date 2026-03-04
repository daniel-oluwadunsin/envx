import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/providers/auth-context";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import AppProvider from "@/lib/providers/app-provider";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "EnvX - Secure Environment Management",
    template: "%s | EnvX",
  },
  description:
    "Secure environment management for modern teams. Sync .env files across machines and teams with zero-trust encryption.",
  keywords: [
    "environment management",
    "secure .env sync",
    "team environment sharing",
    "zero-trust encryption",
    "dev tools",
    "developer productivity",
  ],
  openGraph: {
    title: "EnvX - Secure Environment Management",
    description:
      "Secure environment management for modern teams. Sync .env files across machines and teams with zero-trust encryption.",
    url: "https://envx.oluwadunsin.dev",
    siteName: "EnvX",
    images: [],
    locale: "en-US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EnvX - Secure Environment Management",
    description:
      "Secure environment management for modern teams. Sync .env files across machines and teams with zero-trust encryption.",
    images: [],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${_geist.className} ${_geistMono.className} bg-background text-foreground`}
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
