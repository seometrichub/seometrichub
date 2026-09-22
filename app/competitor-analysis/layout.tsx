import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO Competitor Analysis Tool",

  description:
    "Compare websites with SEOMETRICHUB's SEO competitor analysis tool. Analyze competitor SEO signals and discover opportunities to improve your search visibility.",

  alternates: {
    canonical: "/competitor-analysis",
  },

  openGraph: {
    title: "SEO Competitor Analysis Tool | SEOMETRICHUB",
    description:
      "Compare competitor websites, analyze SEO signals and discover opportunities to improve your search visibility.",
    url: "/competitor-analysis",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "SEO Competitor Analysis Tool | SEOMETRICHUB",
    description:
      "Analyze SEO competitors and discover opportunities with SEOMETRICHUB.",
  },
};

export default function CompetitorAnalysisLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}