import type { Metadata } from "next";
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
  metadataBase: new URL("https://seometrichub.vercel.app"),

  title: {
    default: "SEOMETRICHUB – AI SEO & Digital Marketing Tools",
    template: "%s | SEOMETRICHUB",
  },

  description:
    "SEOMETRICHUB provides AI-powered SEO audit, keyword research and digital marketing tools to help businesses improve search visibility and grow online.",

  keywords: [
    "SEO tools",
    "SEO audit",
    "keyword research",
    "AI SEO",
    "digital marketing",
    "SEO analysis",
    "website SEO checker",
    "SEOMETRICHUB",
  ],

  applicationName: "SEOMETRICHUB",

  authors: [
    {
      name: "SEOMETRICHUB",
    },
  ],

  creator: "SEOMETRICHUB",
  publisher: "SEOMETRICHUB",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://seometrichub.vercel.app",
    siteName: "SEOMETRICHUB",
    title: "SEOMETRICHUB – AI SEO & Digital Marketing Tools",
    description:
      "Audit websites, discover keyword opportunities and improve your SEO with smarter digital marketing tools.",
  },

  twitter: {
    card: "summary_large_image",
    title: "SEOMETRICHUB – AI SEO & Digital Marketing Tools",
    description:
      "AI-powered SEO audit, keyword research and digital marketing tools for modern businesses.",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}