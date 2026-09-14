import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-slate-50 px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h1 className="text-xl font-bold text-red-900">
                Dashboard configuration error
              </h1>

              <p className="mt-2 text-sm text-red-700">
                Supabase server configuration is incomplete.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  const supabaseAdmin = createSupabaseAdmin(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  // ============================================================
  // SUBSCRIPTION
  // ============================================================

  const {
    data: subscription,
    error: subscriptionError,
  } = await supabaseAdmin
    .from("subscriptions")
    .select(
      `
        user_id,
        plan_id,
        status,
        started_at,
        current_period_start,
        current_period_end,
        subscription_end,
        payment_provider
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    console.error(
      "Dashboard subscription lookup failed:",
      subscriptionError,
    );
  }

  // ============================================================
  // PLAN
  // ============================================================

  let plan = null;

  if (subscription?.plan_id) {
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select(
        `
          id,
          code,
          name,
          price_inr,
          duration_months,
          website_audits_limit,
          keyword_searches_limit,
          backlink_analysis_limit,
          competitor_analysis_limit,
          ai_articles_limit,
          social_generations_limit,
          gsc_access,
          reports_history
        `,
      )
      .eq("id", subscription.plan_id)
      .maybeSingle();

    if (error) {
      console.error("Dashboard plan lookup failed:", error);
    }

    plan = data;
  }

  // ============================================================
  // CURRENT MONTH USAGE
  // ============================================================

  const now = new Date();

  const currentPeriodStart =
    `${now.getUTCFullYear()}-` +
    `${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

  const {
    data: monthlyUsage,
    error: monthlyUsageError,
  } = await supabaseAdmin
    .from("monthly_usage")
    .select(
      `
        period_start,
        period_end,
        website_audits_used,
        keyword_searches_used,
        backlink_analysis_used,
        competitor_analysis_used,
        ai_articles_used,
        social_generations_used
      `,
    )
    .eq("user_id", user.id)
    .eq("period_start", currentPeriodStart)
    .maybeSingle();

  if (monthlyUsageError) {
    console.error(
      "Dashboard monthly usage lookup failed:",
      monthlyUsageError,
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return "No expiry";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  const currentMonthName = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(now);

  const planName = plan?.name ?? "Free";
  const planCode = plan?.code ?? "free";
  const status = subscription?.status ?? "active";

  const validUntil =
    subscription?.subscription_end ??
    subscription?.current_period_end ??
    null;

  const isFree = planCode === "free";

  // ============================================================
  // USAGE DATA
  // ============================================================

  const usageItems = [
    {
      title: "Website Audits",
      used: monthlyUsage?.website_audits_used ?? 0,
      limit: plan?.website_audits_limit ?? 0,
    },
    {
      title: "Keyword Searches",
      used: monthlyUsage?.keyword_searches_used ?? 0,
      limit: plan?.keyword_searches_limit ?? 0,
    },
    {
      title: "Backlink Analysis",
      used: monthlyUsage?.backlink_analysis_used ?? 0,
      limit: plan?.backlink_analysis_limit ?? 0,
    },
    {
      title: "Competitor Analysis",
      used: monthlyUsage?.competitor_analysis_used ?? 0,
      limit: plan?.competitor_analysis_limit ?? 0,
    },
    {
      title: "AI Articles",
      used: monthlyUsage?.ai_articles_used ?? 0,
      limit: plan?.ai_articles_limit ?? 0,
    },
    {
      title: "Social Generations",
      used: monthlyUsage?.social_generations_used ?? 0,
      limit: plan?.social_generations_limit ?? 0,
    },
  ].map((item) => {
    const remaining = Math.max(item.limit - item.used, 0);

    const percentage =
      item.limit > 0
        ? Math.min(Math.round((item.used / item.limit) * 100), 100)
        : 0;

    return {
      ...item,
      remaining,
      percentage,
    };
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* DASHBOARD HEADER */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                SEOMETRICHUB
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Dashboard
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Manage your subscription and monthly SEO tool usage.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Back to Home
            </Link>
          </div>

          {/* CURRENT PLAN */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-7 text-white sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Current Plan
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-bold">
                      {planName}
                    </h2>

                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
                      {status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-300">
                    {user.email}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Valid Until
                  </p>

                  <p className="mt-1 text-lg font-bold text-white">
                    {isFree
                      ? "Free Plan"
                      : formatDate(validUntil)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plan
                </p>

                <p className="mt-2 font-bold text-slate-950">
                  {planName}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>

                <p className="mt-2 font-bold capitalize text-emerald-600">
                  {status}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price
                </p>

                <p className="mt-2 font-bold text-slate-950">
                  ₹
                  {Number(
                    plan?.price_inr ?? 0,
                  ).toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment
                </p>

                <p className="mt-2 font-bold capitalize text-slate-950">
                  {subscription?.payment_provider ?? "Free"}
                </p>
              </div>
            </div>
          </section>

          {/* MONTHLY USAGE */}
          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-950">
                Monthly Usage
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {currentMonthName} usage for your {planName} plan.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {usageItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {item.title}
                      </p>

                      <p className="mt-3 text-3xl font-bold text-slate-950">
                        {item.used}
                        <span className="ml-1 text-lg font-semibold text-slate-400">
                          / {item.limit}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-100 px-3 py-2 text-right">
                      <p className="text-xs font-medium text-slate-500">
                        Remaining
                      </p>

                      <p className="text-lg font-bold text-slate-900">
                        {item.remaining}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Used
                      </span>

                      <span className="text-xs font-semibold text-slate-700">
                        {item.percentage}%
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#F97316] transition-all"
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PLAN ACTION */}
          <section className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {isFree
                    ? "Upgrade your SEOMETRICHUB plan"
                    : `${planName} is active`}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {isFree
                    ? "Choose a paid plan to increase your monthly SEO tool limits."
                    : `Your subscription is active until ${formatDate(
                        validUntil,
                      )}.`}
                </p>
              </div>

              <Link
                href="/#pricing"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {isFree ? "View Plans" : "Manage Plan"}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}