import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Google Business Profile Audit Tool",

  description:
    "Audit your Google Business Profile with SEOMETRICHUB. Review business profile information, visibility signals and optimization opportunities for local SEO.",

  alternates: {
    canonical: "/business-audit",
  },

  openGraph: {
    title: "Google Business Profile Audit Tool | SEOMETRICHUB",
    description:
      "Review your Google Business Profile and discover local SEO optimization opportunities with SEOMETRICHUB.",
    url: "/business-audit",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Google Business Profile Audit Tool | SEOMETRICHUB",
    description:
      "Audit your Google Business Profile and discover local SEO opportunities with SEOMETRICHUB.",
  },
};

export default function BusinessAuditLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}