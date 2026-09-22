import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Social Media Content Generator",

  description:
    "Create social media content with SEOMETRICHUB's AI social generator. Generate engaging post ideas and marketing content for your social media campaigns.",

  alternates: {
    canonical: "/social-generator",
  },

  openGraph: {
    title: "AI Social Media Content Generator | SEOMETRICHUB",
    description:
      "Generate social media post ideas and marketing content with SEOMETRICHUB's AI social generator.",
    url: "/social-generator",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "AI Social Media Content Generator | SEOMETRICHUB",
    description:
      "Generate social media content and post ideas with SEOMETRICHUB.",
  },
};

export default function SocialGeneratorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}