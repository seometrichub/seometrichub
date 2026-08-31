import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  try {
    const accessToken = request.headers
      .get("cookie")
      ?.match(/(?:^|;\s*)gbp_access_token=([^;]+)/)?.[1];

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Business Profile is not connected.",
        },
        { status: 401 }
      );
    }

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

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const response = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("GBP accounts API error:", data);

      return NextResponse.json(
        {
          success: false,
          error:
            data?.error?.message ||
            "Failed to fetch Google Business Profile accounts.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      accounts: data.accounts || [],
    });
  } catch (error: any) {
    console.error("GBP accounts error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to fetch Google Business Profile accounts.",
      },
      { status: 500 }
    );
  }
}