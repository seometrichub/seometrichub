import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const accessToken = cookieHeader
      .match(/(?:^|;\s*)gbp_access_token=([^;]+)/)?.[1];

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Business Profile is not connected.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Business Profile account ID is required.",
        },
        { status: 400 }
      );
    }

    const readMask = [
      "name",
      "title",
      "storeCode",
      "websiteUri",
      "phoneNumbers",
      "storefrontAddress",
      "categories",
      "regularHours",
      "specialHours",
      "openInfo",
      "metadata",
    ].join(",");

    const endpoint =
      `https://mybusinessbusinessinformation.googleapis.com/v1/` +
      `accounts/${encodeURIComponent(accountId)}/locations` +
      `?readMask=${encodeURIComponent(readMask)}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GBP locations API error:", data);

      return NextResponse.json(
        {
          success: false,
          error:
            data?.error?.message ||
            "Failed to fetch Google Business Profile locations.",
          googleStatus: response.status,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      accountId,
      locations: data.locations || [],
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error: any) {
    console.error("GBP locations error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to fetch Google Business Profile locations.",
      },
      { status: 500 }
    );
  }
}