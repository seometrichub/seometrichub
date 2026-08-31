import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_BUSINESS_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Business Profile OAuth configuration is missing.",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const returnUrl = searchParams.get("state") || "/business-audit";

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Business Profile authorization failed.",
          details: error,
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Authorization code is missing.",
        },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    const response = NextResponse.redirect(
      new URL(returnUrl, request.url)
    );

    if (tokens.access_token) {
      response.cookies.set("gbp_access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set("gbp_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    response.cookies.set("gbp_connected", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error(
      "Google Business Profile OAuth callback error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Google Business Profile connection failed.",
        details:
          error?.response?.data?.error_description ||
          error?.message ||
          "Unknown error",
      },
      { status: 500 }
    );
  }
}