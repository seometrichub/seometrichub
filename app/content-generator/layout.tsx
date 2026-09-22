import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI SEO Content Generator",

  description:
    "Create SEO-focused content with SEOMETRICHUB's AI content generator. Generate useful content ideas and optimized website content for your digital marketing strategy.",

  alternates: {
    canonical: "/content-generator",
  },

  openGraph: {
    title: "AI SEO Content Generator | SEOMETRICHUB",
    description:
      "Create SEO-focused website content and content ideas with SEOMETRICHUB's AI content generator.",
    url: "/content-generator",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "AI SEO Content Generator | SEOMETRICHUB",
    description:
      "Create SEO-focused content and content ideas with SEOMETRICHUB.",
  },
};

export default function ContentGeneratorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}