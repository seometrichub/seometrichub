import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_BUSINESS_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          error: "Google OAuth environment variables are not configured.",
        },
        { status: 500 }
      );
    }

    const returnUrl = searchParams.get("returnUrl") || "/business-audit";

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      state: returnUrl,
      scope: [
        "https://www.googleapis.com/auth/business.manage",
      ],
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google Business Profile OAuth start error:", error);

    return NextResponse.json(
      {
        error: "Failed to start Google Business Profile OAuth.",
      },
      { status: 500 }
    );
  }
}