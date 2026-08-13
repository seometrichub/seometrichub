import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          error: "Google OAuth credentials are not configured.",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.json(
        {
          error: "Google OAuth authorization failed.",
          details: error,
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
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

    oauth2Client.setCredentials(tokens);

    const searchConsole = google.webmasters({
      version: "v3",
      auth: oauth2Client,
    });

    const sitesResponse = await searchConsole.sites.list();

    const sites = (sitesResponse.data.siteEntry || []).map((site) => ({
      siteUrl: site.siteUrl || "",
      permissionLevel: site.permissionLevel || "",
    }));

    const response = NextResponse.json({
      success: true,
      message: "Google Search Console connected successfully.",
      sites,
    });

    /*
     * Development session cookie.
     *
     * HTTP-only means browser JavaScript cannot read the token.
     * The token is therefore not exposed through the URL.
     */
    if (tokens.access_token) {
      response.cookies.set(
        "gsc_access_token",
        tokens.access_token,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60,
        }
      );
    }

    if (tokens.refresh_token) {
      response.cookies.set(
        "gsc_refresh_token",
        tokens.refresh_token,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        }
      );
    }

    return response;
  } catch (error: any) {
    console.error(
      "Google Search Console OAuth callback error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Google Search Console connection failed.",
        details:
          error?.response?.data?.error_description ||
          error?.message ||
          "Unknown error",
      },
      { status: 500 }
    );
  }
}