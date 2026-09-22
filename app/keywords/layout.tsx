import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keyword Research Tool",

  description:
    "Discover keyword opportunities with SEOMETRICHUB. Research relevant keywords, search insights and SEO opportunities to improve your website's organic visibility.",

  alternates: {
    canonical: "/keywords",
  },

  openGraph: {
    title: "Keyword Research Tool | SEOMETRICHUB",
    description:
      "Discover keyword opportunities and SEO insights to improve your website's search visibility with SEOMETRICHUB.",
    url: "/keywords",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Keyword Research Tool | SEOMETRICHUB",
    description:
      "Discover keyword opportunities and SEO insights with SEOMETRICHUB.",
  },
};

export default function KeywordsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}