import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "HealthBot",
  title: "Health Assistant Chatbot",
  description: "Chatbot for managing medicine and health assistance",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HealthBot",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AccessibilityProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <AccessibilityWidget />
        </AccessibilityProvider>
      </body>
    </html>
  );
}

