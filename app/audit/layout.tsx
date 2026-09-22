import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Website SEO Audit Tool",

  description:
    "Run a free website SEO audit with SEOMETRICHUB. Analyze technical SEO, meta tags, content, mobile optimization, links, images and SEO opportunities.",

  alternates: {
    canonical: "/audit",
  },

  openGraph: {
    title: "Free Website SEO Audit Tool | SEOMETRICHUB",
    description:
      "Analyze your website's SEO, technical issues, meta tags, content and optimization opportunities with SEOMETRICHUB.",
    url: "/audit",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Free Website SEO Audit Tool | SEOMETRICHUB",
    description:
      "Analyze your website and discover SEO issues and optimization opportunities with SEOMETRICHUB.",
  },
};

export default function AuditLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}