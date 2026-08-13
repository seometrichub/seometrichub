import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);

    return {
      origin: url.origin.replace(/\/$/, ""),
      hostname: url.hostname.toLowerCase(),
    };
  } catch {
    return {
      origin: value.replace(/\/$/, "").toLowerCase(),
      hostname: value
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .toLowerCase(),
    };
  }
}

function getMatchingProperty(
  requestedSiteUrl: string,
  properties: Array<{
    siteUrl?: string | null;
    permissionLevel?: string | null;
  }>
) {
  const requested = normalizeUrl(requestedSiteUrl);

  // 1. Exact URL property match
  const exactMatch = properties.find((property) => {
    if (!property.siteUrl) return false;

    return (
      normalizeUrl(property.siteUrl).origin === requested.origin
    );
  });

  if (exactMatch) {
    return exactMatch;
  }

  // 2. Domain property match: sc-domain:example.com
  const domainMatch = properties.find((property) => {
    if (!property.siteUrl) return false;

    const propertyUrl = property.siteUrl.toLowerCase();

    if (!propertyUrl.startsWith("sc-domain:")) {
      return false;
    }

    const domain = propertyUrl
      .replace("sc-domain:", "")
      .trim()
      .toLowerCase();

    return (
      requested.hostname === domain ||
      requested.hostname.endsWith(`.${domain}`)
    );
  });

  return domainMatch || null;
}

export async function GET(request: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          success: false,
          error: "Google OAuth credentials are not configured.",
        },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get("gsc_access_token")?.value;

    const refreshToken =
      cookieStore.get("gsc_refresh_token")?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: "Google Search Console is not connected.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const requestedSiteUrl = searchParams.get("siteUrl");

    if (!requestedSiteUrl) {
      return NextResponse.json(
        {
          success: false,
          connected: true,
          error: "Website URL is required.",
        },
        { status: 400 }
      );
    }

    let normalizedRequestedSiteUrl: string;

    try {
      const parsedUrl = new URL(requestedSiteUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }

      normalizedRequestedSiteUrl =
        parsedUrl.origin + "/";
    } catch {
      return NextResponse.json(
        {
          success: false,
          connected: true,
          error: "Invalid website URL.",
        },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const searchConsole = google.searchconsole({
      version: "v1",
      auth: oauth2Client,
    });

    /*
     * Get all Search Console properties available
     * to the currently connected Google account.
     */
    const sitesResponse =
      await searchConsole.sites.list();

    const properties =
      sitesResponse.data.siteEntry || [];

    /*
     * IMPORTANT:
     *
     * We never use another website's property.
     * We first find a property that belongs to
     * the website currently being audited.
     */
    const matchingProperty = getMatchingProperty(
      normalizedRequestedSiteUrl,
      properties
    );

    if (!matchingProperty?.siteUrl) {
      return NextResponse.json(
        {
          success: false,
          connected: true,
          propertyAccess: false,
          requestedSiteUrl: normalizedRequestedSiteUrl,
          error:
            "Your Google account does not have access to this Search Console property.",
          message:
            `No Search Console property was found for ${normalizedRequestedSiteUrl}`,
        },
        { status: 403 }
      );
    }

    const siteUrl = matchingProperty.siteUrl;

    const endDate = new Date();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    const startDateString = formatDate(startDate);
    const endDateString = formatDate(endDate);

    const response =
      await searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDateString,
          endDate: endDateString,
          dimensions: ["query"],
          rowLimit: 10,
        },
      });

    const rows = response.data.rows || [];

    let totalClicks = 0;
    let totalImpressions = 0;
    let totalCtr = 0;
    let totalPosition = 0;

    for (const row of rows) {
      totalClicks += row.clicks ?? 0;
      totalImpressions += row.impressions ?? 0;
      totalCtr += row.ctr ?? 0;
      totalPosition += row.position ?? 0;
    }

    const averageCtr =
      rows.length > 0
        ? Number(
            ((totalCtr / rows.length) * 100).toFixed(2)
          )
        : 0;

    const averagePosition =
      rows.length > 0
        ? Number(
            (totalPosition / rows.length).toFixed(2)
          )
        : 0;

    return NextResponse.json({
      success: true,
      connected: true,
      propertyAccess: true,

      requestedSiteUrl: normalizedRequestedSiteUrl,

      siteUrl,

      propertyPermission:
        matchingProperty.permissionLevel || "",

      period: {
        startDate: startDateString,
        endDate: endDateString,
        days: 28,
      },

      summary: {
        clicks: Math.round(totalClicks),
        impressions: Math.round(totalImpressions),
        averageCtr,
        averagePosition,
      },

      queries: rows.map((row) => ({
        query: row.keys?.[0] ?? "",
        clicks: Math.round(row.clicks ?? 0),
        impressions: Math.round(
          row.impressions ?? 0
        ),
        ctr: Number(
          ((row.ctr ?? 0) * 100).toFixed(2)
        ),
        position: Number(
          (row.position ?? 0).toFixed(2)
        ),
      })),
    });
  } catch (error: any) {
    console.error(
      "Search Console API error:",
      error
    );

    const googleMessage =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Unknown error";

    if (
      googleMessage
        .toLowerCase()
        .includes("permission")
    ) {
      return NextResponse.json(
        {
          success: false,
          connected: true,
          propertyAccess: false,
          error:
            "Your Google account does not have access to this Search Console property.",
          details: googleMessage,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        connected: true,
        error:
          "Failed to fetch Google Search Console data.",
        details: googleMessage,
      },
      { status: 500 }
    );
  }
}