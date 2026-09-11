import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const accessToken = request.headers
      .get("cookie")
      ?.match(/(?:^|;\s*)gbp_access_token=([^;]+)/)?.[1];

    if (!accessToken) {
      console.error("GBP accounts: gbp_access_token cookie missing");

      return NextResponse.json(
        {
          success: false,
          error: "Google Business Profile is not connected.",
        },
        { status: 401 }
      );
    }

    console.log("GBP accounts: access token cookie found");

    const response = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const rawText = await response.text();

    console.log("GBP accounts API status:", response.status);
    console.log(
      "GBP accounts API response:",
      rawText || "(empty response body)"
    );

    let data: any = {};

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = {};
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          error:
            data?.error?.message ||
            rawText ||
            `Google Business Profile API returned HTTP ${response.status}.`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      accounts: data.accounts || [],
    });
  } catch (error: any) {
    console.error(
      "GBP accounts route error:",
      error?.message || error
    );

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
