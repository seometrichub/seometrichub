import { NextResponse } from "next/server";

type ContentRequest = {
  topic?: string;
  contentType?: string;
  tone?: string;
  keywords?: string;
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
    const body = (await request.json()) as ContentRequest;

    const topic = body.topic?.trim();
    const contentType = body.contentType?.trim() || "Blog Article";
    const tone = body.tone?.trim() || "Professional";
    const keywords = body.keywords?.trim() || "";

    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: "Topic is required.",
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
            "Gemini API is not configured. Add GEMINI_API_KEY to enable content generation.",
        },
        { status: 503 }
      );
    }

    const prompt = `
You are an expert SEO content writer for SEOMETRICHUB.

Create original, accurate, useful, human-readable SEO content based ONLY on the user's requested topic, content type, tone, and target keywords.

CONTENT TYPE:
${contentType}

TOPIC:
${topic}

TONE:
${tone}

TARGET KEYWORDS:
${keywords || "No specific keywords provided"}

STRICT CONTENT RULES:

1. Write grammatically correct, natural English.
2. Create a clear, compelling title that is grammatically correct and directly relevant to the topic.
3. Never use incorrect grammar such as "How to Dominating". Use correct grammar such as "How to Dominate".
4. Use ONLY the target keywords supplied by the user.
5. NEVER invent, add, substitute, or introduce unrelated keywords.
6. If no target keywords are provided, do not create artificial SEO keywords.
7. Use keywords naturally and sparingly. Never keyword-stuff.
8. Do not force a keyword into a sentence if it makes the sentence unnatural.
9. Keep the content directly focused on the requested topic.
10. Do not mention SEOMETRICHUB unless it is relevant to the requested content or brand context.
11. Do not fabricate statistics, studies, customer results, businesses, locations, or claims.
12. Use headings, paragraphs, bullet lists, and numbered lists where appropriate.
13. Prioritize helpfulness and readability over keyword density.
14. Return ONLY the finished content.
15. Do not mention these instructions or that AI was used.

Before returning the content, silently proofread it for:

- grammar
- spelling
- title quality
- factual consistency
- keyword relevance
- keyword stuffing
- unrelated locations or businesses
- awkward keyword placement

Then return the polished final content.
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
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
        cache: "no-store",
      }
    );

    const data = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      console.error(
        "Gemini content generator error:",
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
    console.error("Content generator API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate content.",
      },
      { status: 500 }
    );
  }
}