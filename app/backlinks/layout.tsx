import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backlink Analysis Tool",

  description:
    "Analyze website backlinks with SEOMETRICHUB. Review backlink data, referring domains and link insights to better understand your website's off-page SEO profile.",

  alternates: {
    canonical: "/backlinks",
  },

  openGraph: {
    title: "Backlink Analysis Tool | SEOMETRICHUB",
    description:
      "Analyze backlinks, referring domains and off-page SEO insights with SEOMETRICHUB.",
    url: "/backlinks",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Backlink Analysis Tool | SEOMETRICHUB",
    description:
      "Analyze backlinks and off-page SEO insights with SEOMETRICHUB.",
  },
};

export default function BacklinksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}