import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

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

  const planName = plan?.name ?? "Free";
  const planCode = plan?.code ?? "free";
  const status = subscription?.status ?? "active";

  const validUntil =
    subscription?.subscription_end ??
    subscription?.current_period_end ??
    null;

  const isFree = planCode === "free";

  const usageLimits = [
    {
      title: "Website Audits",
      limit: plan?.website_audits_limit ?? 0,
    },
    {
      title: "Keyword Searches",
      limit: plan?.keyword_searches_limit ?? 0,
    },
    {
      title: "Backlink Analysis",
      limit: plan?.backlink_analysis_limit ?? 0,
    },
    {
      title: "Competitor Analysis",
      limit: plan?.competitor_analysis_limit ?? 0,
    },
    {
      title: "AI Articles",
      limit: plan?.ai_articles_limit ?? 0,
    },
    {
      title: "Social Generations",
      limit: plan?.social_generations_limit ?? 0,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              SEOMETRICHUB
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Manage your subscription and SEO tool limits.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            Back to Home
          </Link>
        </div>

        {/* PLAN CARD */}
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
                ₹{Number(plan?.price_inr ?? 0).toLocaleString("en-IN")}
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

        {/* MONTHLY LIMITS */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-950">
              Monthly Plan Limits
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Your current plan includes these monthly SEO tool limits.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usageLimits.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-600">
                  {item.title}
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {item.limit}
                </p>

                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  per month
                </p>
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
  );
}