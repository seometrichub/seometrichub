import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  const adminClient = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: adminRecord, error: adminError } = await adminClient
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || adminRecord?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    return NextResponse.json({
      configured: false,
      authenticated: false,
    });
  }

  try {
    const authorization = Buffer.from(`${login}:${password}`).toString("base64");

    const response = await fetch(
      "https://api.dataforseo.com/v3/appendix/user_data",
      {
        method: "GET",
        headers: { Authorization: `Basic ${authorization}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    return NextResponse.json(
      {
        configured: true,
        credentialFormat: {
          loginLength: login.length,
          passwordLength: password.length,
          loginHasOuterSpaces: login !== login.trim(),
          passwordHasOuterSpaces: password !== password.trim(),
          loginHasQuotes: /^["']|["']$/.test(login),
          passwordHasQuotes: /^["']|["']$/.test(password),
        },
        httpStatus: response.status,
        authenticated: response.ok,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Provider connection failed" },
      { status: 502 }
    );
  }
}
