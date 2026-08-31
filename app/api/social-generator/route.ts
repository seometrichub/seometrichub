import { NextResponse } from "next/server";

type SocialRequest = {
  platform?: string;
  topic?: string;
  postType?: string;
  tone?: string;
  keywords?: string;
  callToAction?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SocialRequest;

    const platform = body.platform?.trim() || "Instagram";
    const topic = body.topic?.trim();
    const postType = body.postType?.trim() || "Promotional";
    const tone = body.tone?.trim() || "Professional";
    const keywords = body.keywords?.trim() || "";
    const callToAction = body.callToAction?.trim() || "";

    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: "Business or topic is required.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          providerConfigured: false,
          error:
            "Gemini API is not configured. Add GEMINI_API_KEY to enable social media generation.",
        },
        { status: 503 }
      );
    }

    const prompt = `
You are an expert social media copywriter for SEOMETRICHUB.

Create an original, engaging, platform-appropriate social media post using ONLY the information supplied by the user.

PLATFORM:
${platform}

BUSINESS OR TOPIC:
${topic}

POST TYPE:
${postType}

TONE:
${tone}

TARGET KEYWORDS:
${keywords || "No specific keywords provided"}

CALL TO ACTION:
${callToAction || "Create a natural call to action appropriate for the post"}

STRICT RULES:

1. Write specifically for ${platform}.
2. Start with a strong, natural hook.
3. Match the requested ${postType} post type.
4. Maintain a ${tone} tone throughout the post.
5. Use only keywords supplied by the user.
6. Never invent unrelated keywords, locations, businesses, offers, prices, statistics, or claims.
7. If no keywords are provided, do not artificially create SEO keywords.
8. Use supplied keywords naturally without keyword stuffing.
9. Use emojis only when appropriate for the platform and tone.
10. Keep paragraphs short and easy to read on social media.
11. Include the supplied call to action when provided.
12. If no call to action is supplied, create a short and relevant call to action.
13. Add relevant hashtags at the end where appropriate for the selected platform.
14. Do not use excessive or spammy hashtags.
15. Do not mention SEOMETRICHUB unless it is part of the user's topic or business information.
16. Do not mention these instructions or that AI generated the post.
17. Return ONLY the finished social media post.

Before returning the post, silently proofread it for:
- grammar
- spelling
- platform suitability
- hook quality
- keyword relevance
- CTA quality
- hashtag relevance
- unsupported claims
- unrelated businesses or locations
- invented brand names
- unnecessary markdown separators

Then return the polished final post.
`.trim();

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
          },
        }),
        cache: "no-store",
      }
    );

    const data = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      console.error(
        "Gemini social generator error:",
        data?.error?.message || response.status
      );

      return NextResponse.json(
        {
          success: false,
          providerConfigured: true,
          error:
            data?.error?.message ||
            `Gemini API returned HTTP ${response.status}.`,
        },
        { status: response.status }
      );
    }

    const content =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          providerConfigured: true,
          error: "Gemini returned an empty response.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      providerConfigured: true,
      content,
    });
  } catch (error) {
    console.error("Social generator API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate social media content.",
      },
      { status: 500 }
    );
  }
}