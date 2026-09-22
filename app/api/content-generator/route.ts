import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

type GeminiResult = {
  ok: boolean;
  status: number;
  data: GeminiResponse;
  model: string;
};

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.6-flash";

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  maxAttempts = 3,
): Promise<GeminiResult> {
  let lastResult: GeminiResult = {
    ok: false,
    status: 503,
    data: {
      error: {
        message: "Gemini service is temporarily unavailable.",
      },
    },
    model,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
        },
      );

      let data: GeminiResponse;

      try {
        data = (await response.json()) as GeminiResponse;
      } catch {
        data = {
          error: {
            message: `Gemini API returned HTTP ${response.status}.`,
          },
        };
      }

      lastResult = {
        ok: response.ok,
        status: response.status,
        data,
        model,
      };

      if (response.ok) {
        return lastResult;
      }

      console.error("Gemini content generator attempt failed:", {
        model,
        attempt,
        status: response.status,
        message:
          data?.error?.message ||
          `Gemini API returned HTTP ${response.status}.`,
      });

      if (
        !RETRYABLE_STATUSES.has(response.status) ||
        attempt === maxAttempts
      ) {
        return lastResult;
      }
    } catch (error) {
      console.error("Gemini content generator network error:", {
        model,
        attempt,
        error,
      });

      lastResult = {
        ok: false,
        status: 503,
        data: {
          error: {
            message: "Unable to reach the Gemini API.",
          },
        },
        model,
      };

      if (attempt === maxAttempts) {
        return lastResult;
      }
    }

    // Short exponential backoff:
    // attempt 1 -> 1 second
    // attempt 2 -> 2 seconds
    await sleep(1000 * 2 ** (attempt - 1));
  }

  return lastResult;
}

function extractContent(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Please sign in to use content generation.",
        },
        { status: 401 },
      );
    }

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
        { status: 400 },
      );
    }

    if (topic.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Topic must be 200 characters or less.",
        },
        { status: 400 },
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
        { status: 503 },
      );
    }

    // ============================================================
    // CHECK QUOTA ONLY - DO NOT INCREMENT YET
    // ============================================================

    const { data: quotaCheckRows, error: quotaCheckError } =
      await supabase.rpc("get_tool_usage", {
        p_user_id: user.id,
        p_tool: "ai_article",
      });

    if (quotaCheckError) {
      console.error("Content generator quota check failed:", {
        message: quotaCheckError.message,
        code: quotaCheckError.code,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify your content generation usage limit.",
        },
        { status: 500 },
      );
    }

    const quotaCheck = Array.isArray(quotaCheckRows)
      ? quotaCheckRows[0]
      : null;

    if (!quotaCheck) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify your content generation usage limit.",
        },
        { status: 500 },
      );
    }

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Monthly content generation limit reached.",
          quota: {
            used: quotaCheck.used,
            limit: quotaCheck.limit_value,
            remaining: quotaCheck.remaining,
            periodEnd: quotaCheck.period_end,
          },
        },
        { status: 429 },
      );
    }

    // ============================================================
    // GENERATE CONTENT
    // ============================================================

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

    // ============================================================
    // PRIMARY MODEL
    // ============================================================

    let geminiResult = await callGemini(
      apiKey,
      PRIMARY_MODEL,
      prompt,
      3,
    );

    let content = geminiResult.ok
      ? extractContent(geminiResult.data)
      : "";

    // ============================================================
    // FALLBACK MODEL
    // Only use fallback when the primary model failed with a
    // transient provider error.
    // ============================================================

    if (
      !content &&
      RETRYABLE_STATUSES.has(geminiResult.status)
    ) {
      console.warn("Trying Gemini fallback model:", {
        primaryModel: PRIMARY_MODEL,
        fallbackModel: FALLBACK_MODEL,
        primaryStatus: geminiResult.status,
      });

      geminiResult = await callGemini(
        apiKey,
        FALLBACK_MODEL,
        prompt,
        2,
      );

      content = geminiResult.ok
        ? extractContent(geminiResult.data)
        : "";
    }

    if (!geminiResult.ok) {
      console.error("Gemini content generator final failure:", {
        model: geminiResult.model,
        status: geminiResult.status,
        message:
          geminiResult.data?.error?.message ||
          `Gemini API returned HTTP ${geminiResult.status}.`,
      });

      const publicStatus =
        geminiResult.status === 429 ? 429 : 503;

      return NextResponse.json(
        {
          success: false,
          providerConfigured: true,
          error:
            geminiResult.status === 429
              ? "AI generation is temporarily rate limited. Please try again shortly."
              : "AI content generation is temporarily unavailable. Please try again shortly.",
          quota: {
            used: quotaCheck.used,
            limit: quotaCheck.limit_value,
            remaining: quotaCheck.remaining,
            periodEnd: quotaCheck.period_end,
          },
        },
        { status: publicStatus },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          providerConfigured: true,
          error: "Gemini returned an empty response.",
          quota: {
            used: quotaCheck.used,
            limit: quotaCheck.limit_value,
            remaining: quotaCheck.remaining,
            periodEnd: quotaCheck.period_end,
          },
        },
        { status: 502 },
      );
    }

    // ============================================================
    // SUCCESS - NOW CONSUME ONE QUOTA
    // ============================================================

    const { data: quotaConsumeRows, error: quotaConsumeError } =
      await supabase.rpc("consume_tool_usage", {
        p_user_id: user.id,
        p_tool: "ai_article",
      });

    if (quotaConsumeError) {
      console.error("Content generator quota consume failed:", {
        message: quotaConsumeError.message,
        code: quotaConsumeError.code,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "Content was generated, but usage could not be recorded. Please try again.",
        },
        { status: 500 },
      );
    }

    const quota = Array.isArray(quotaConsumeRows)
      ? quotaConsumeRows[0]
      : null;

    if (!quota) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Content was generated, but usage could not be recorded. Please try again.",
        },
        { status: 500 },
      );
    }

    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Monthly content generation limit reached.",
          quota: {
            used: quota.used,
            limit: quota.limit_value,
            remaining: quota.remaining,
            periodEnd: quota.period_end,
          },
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      success: true,
      providerConfigured: true,
      model: geminiResult.model,
      content,
      quota: {
        used: quota.used,
        limit: quota.limit_value,
        remaining: quota.remaining,
        periodEnd: quota.period_end,
      },
    });
  } catch (error) {
    console.error("Content generator API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate content.",
      },
      { status: 500 },
    );
  }
}