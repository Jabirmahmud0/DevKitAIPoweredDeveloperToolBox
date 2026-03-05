import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "DevKit — AI-Powered Developer Toolbox",
  description:
    "10 powerful developer tools in one tab: AI Code Reviewer, SQL Playground, Regex Lab, JSON Toolkit, Code Runner, Color Studio, Markdown Studio, Crypto Toolkit, API Tester, and AST Explorer.",
  keywords: [
    "developer tools",
    "AI code review",
    "SQL playground",
    "regex tester",
    "JSON formatter",
    "code runner",
    "color palette",
    "markdown editor",
    "crypto toolkit",
    "AST explorer",
  ],
  authors: [{ name: "DevKit" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DevKit",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c6af5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-radial`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
