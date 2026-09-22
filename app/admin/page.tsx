import DeleteUserButton from "./DeleteUserButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";

type AuthUser = {
  id: string;
  email?: string;
  created_at: string;
};

type Plan = {
  id: number;
  code: string;
  name: string;
  price_inr: number | string | null;
};

type Subscription = {
  user_id: string;
  plan_id: number;
  status: string;
  started_at: string | null;
  subscription_end: string | null;
  payment_provider: string | null;
};

type Payment = {
  id: string;
  user_id: string;
  plan_id: number;
  provider: string | null;
  txnid: string | null;
  mihpayid: string | null;
  status: string;
  amount: number | string | null;
  currency: string | null;
  created_at: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatMoney(value: number | string | null | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default async function AdminPage() {
  // ============================================================
  // 1. AUTHENTICATED USER
  // ============================================================

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // ============================================================
  // 2. SERVER-ONLY SUPABASE ADMIN CLIENT
  // ============================================================

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-slate-50 px-6 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h1 className="text-xl font-bold text-red-900">
                Admin configuration error
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
  // 3. ADMIN ACCESS CHECK
  // IMPORTANT:
  // User authentication comes from the normal cookie session.
  // Admin role verification happens server-side with service role.
  // ============================================================

  const {
    data: adminRecord,
    error: adminCheckError,
  } = await supabaseAdmin
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminCheckError) {
    console.error(
      "Admin access lookup failed:",
      adminCheckError,
    );

    redirect("/dashboard");
  }

  if (!adminRecord || adminRecord.role !== "admin") {
    redirect("/dashboard");
  }

  // ============================================================
  // 4. LOAD AUTH USERS
  // ============================================================

  const authUsers: AuthUser[] = [];

  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } =
      await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

    if (error) {
      console.error(
        "Admin users lookup failed:",
        error,
      );
      break;
    }

    const users = data.users ?? [];

    authUsers.push(
      ...users.map((item) => ({
        id: item.id,
        email: item.email,
        created_at: item.created_at,
      })),
    );

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  // ============================================================
  // 5. LOAD PLANS
  // ============================================================

  const {
    data: plansData,
    error: plansError,
  } = await supabaseAdmin
    .from("plans")
    .select("id, code, name, price_inr")
    .order("price_inr", { ascending: true });

  if (plansError) {
    console.error(
      "Admin plans lookup failed:",
      plansError,
    );
  }

  const plans = (plansData ?? []) as Plan[];

  const planMap = new Map(
    plans.map((plan) => [
      Number(plan.id),
      plan,
    ]),
  );

  // ============================================================
  // 6. LOAD SUBSCRIPTIONS
  // ============================================================

  const {
    data: subscriptionsData,
    error: subscriptionsError,
  } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      user_id,
      plan_id,
      status,
      started_at,
      subscription_end,
      payment_provider
    `);

  if (subscriptionsError) {
    console.error(
      "Admin subscriptions lookup failed:",
      subscriptionsError,
    );
  }

  const subscriptions =
    (subscriptionsData ?? []) as Subscription[];

  const subscriptionMap = new Map(
    subscriptions.map((subscription) => [
      subscription.user_id,
      subscription,
    ]),
  );

  // ============================================================
  // 7. LOAD PAYMENTS
  // ============================================================

  const {
    data: paymentsData,
    error: paymentsError,
  } = await supabaseAdmin
    .from("payment_transactions")
    .select(`
      id,
      user_id,
      plan_id,
      provider,
      txnid,
      mihpayid,
      status,
      amount,
      currency,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  if (paymentsError) {
    console.error(
      "Admin payments lookup failed:",
      paymentsError,
    );
  }

  const payments =
    (paymentsData ?? []) as Payment[];

  // ============================================================
  // 8. CALCULATIONS
  // ============================================================

  const now = new Date();

  const successfulPayments = payments.filter(
    (payment) =>
      payment.status?.toLowerCase() === "success",
  );

  const totalRevenue = successfulPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount ?? 0),
    0,
  );

  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();

  const thisMonthPayments =
    successfulPayments.filter((payment) => {
      const paymentDate =
        new Date(payment.created_at);

      return (
        paymentDate.getUTCMonth() ===
          currentMonth &&
        paymentDate.getUTCFullYear() ===
          currentYear
      );
    });

  const thisMonthRevenue =
    thisMonthPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount ?? 0),
      0,
    );

  const activeSubscriptions =
    subscriptions.filter((subscription) => {
      if (subscription.status !== "active") {
        return false;
      }

      const plan = planMap.get(
        Number(subscription.plan_id),
      );

      if (!plan) {
        return false;
      }

      if (plan.code === "free") {
        return true;
      }

      if (!subscription.subscription_end) {
        return false;
      }

      return (
        new Date(
          subscription.subscription_end,
        ).getTime() > now.getTime()
      );
    });

  const paidSubscriptions =
    activeSubscriptions.filter(
      (subscription) => {
        const plan = planMap.get(
          Number(subscription.plan_id),
        );

        return Boolean(
          plan && plan.code !== "free",
        );
      },
    );

  const paidUserIds = new Set(
    paidSubscriptions.map(
      (subscription) =>
        subscription.user_id,
    ),
  );

  const totalUsers = authUsers.length;
  const paidUsers = paidUserIds.size;

  const freeUsers = Math.max(
    totalUsers - paidUsers,
    0,
  );

  const recentUsers = [...authUsers]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .slice(0, 10);

  const recentPayments =
    payments.slice(0, 10);

  // ============================================================
  // 9. DASHBOARD STATS
  // ============================================================

  const stats = [
    {
      title: "Total Users",
      value:
        totalUsers.toLocaleString("en-IN"),
      description: "Registered accounts",
    },
    {
      title: "Free Users",
      value:
        freeUsers.toLocaleString("en-IN"),
      description:
        "Users without an active paid plan",
    },
    {
      title: "Paid Users",
      value:
        paidUsers.toLocaleString("en-IN"),
      description:
        "Active paid subscribers",
    },
    {
      title: "Active Subscriptions",
      value:
        paidSubscriptions.length.toLocaleString(
          "en-IN",
        ),
      description:
        "Currently active paid plans",
    },
    {
      title: "Total Revenue",
      value: formatMoney(totalRevenue),
      description: "Successful payments",
    },
    {
      title: "This Month Revenue",
      value: formatMoney(
        thisMonthRevenue,
      ),
      description:
        "Successful payments this month",
    },
  ];

  // ============================================================
  // 10. UI
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* HEADER */}

          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
                SEOMETRICHUB ADMIN
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Admin Dashboard
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Monitor users,
                subscriptions and payments.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Signed in as {user.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                User Dashboard
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {/* OVERVIEW */}

          <section>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-950">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* RECENT USERS */}

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-950">
                Recent Users
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest registered
                SEOMETRICHUB accounts.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      Email
                    </th>

                    <th className="px-6 py-4">
                      Plan
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Signed Up
                    </th>
                    <th className="px-6 py-4">
  Actions
</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentUsers.map(
                    (recentUser) => {
                      const subscription =
                        subscriptionMap.get(
                          recentUser.id,
                        );

                      const plan = subscription
                        ? planMap.get(
                            Number(
                              subscription.plan_id,
                            ),
                          )
                        : null;

                      const isPaid =
                        paidUserIds.has(
                          recentUser.id,
                        );

                      return (
                        <tr
                          key={recentUser.id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {recentUser.email ??
                              "No email"}
                          </td>

                          <td className="px-6 py-4 text-slate-700">
                            {isPaid
                              ? plan?.name ??
                                "Paid"
                              : "Free"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isPaid
                                ? "Paid"
                                : "Free"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                            {formatDateTime(
                              recentUser.created_at,
                            )}
                          </td>
                          <td className="px-6 py-4">
  <DeleteUserButton
    userId={recentUser.id}
    email={recentUser.email ?? "this user"}
    disabled={recentUser.id === user.id}
  />
</td>
                        </tr>
                      );
                    },
                  )}

                  {recentUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ACTIVE PAID SUBSCRIPTIONS */}

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-950">
                Active Paid
                Subscriptions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Users with a currently
                valid paid plan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      User
                    </th>

                    <th className="px-6 py-4">
                      Plan
                    </th>

                    <th className="px-6 py-4">
                      Price
                    </th>

                    <th className="px-6 py-4">
                      Provider
                    </th>

                    <th className="px-6 py-4">
                      Valid Until
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paidSubscriptions.map(
                    (subscription) => {
                      const account =
                        authUsers.find(
                          (item) =>
                            item.id ===
                            subscription.user_id,
                        );

                      const plan =
                        planMap.get(
                          Number(
                            subscription.plan_id,
                          ),
                        );

                      return (
                        <tr
                          key={
                            subscription.user_id
                          }
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {account?.email ??
                              subscription.user_id}
                          </td>

                          <td className="px-6 py-4 text-slate-700">
                            {plan?.name ??
                              "Unknown"}
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {formatMoney(
                              plan?.price_inr,
                            )}
                          </td>

                          <td className="px-6 py-4 capitalize text-slate-700">
                            {subscription.payment_provider ??
                              "-"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                            {formatDate(
                              subscription.subscription_end,
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}

                  {paidSubscriptions.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No active paid
                        subscriptions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* RECENT PAYMENTS */}

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-950">
                Recent Payments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest PayU payment
                transactions.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      User
                    </th>

                    <th className="px-6 py-4">
                      Plan
                    </th>

                    <th className="px-6 py-4">
                      Amount
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Transaction ID
                    </th>

                    <th className="px-6 py-4">
                      PayU ID
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map(
                    (payment) => {
                      const account =
                        authUsers.find(
                          (item) =>
                            item.id ===
                            payment.user_id,
                        );

                      const plan =
                        planMap.get(
                          Number(
                            payment.plan_id,
                          ),
                        );

                      const isSuccess =
                        payment.status?.toLowerCase() ===
                        "success";

                      return (
                        <tr
                          key={payment.id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {account?.email ??
                              payment.user_id}
                          </td>

                          <td className="px-6 py-4 text-slate-700">
                            {plan?.name ??
                              "Unknown"}
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {formatMoney(
                              payment.amount,
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                isSuccess
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">
                            {payment.txnid ??
                              "-"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">
                            {payment.mihpayid ??
                              "-"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                            {formatDateTime(
                              payment.created_at,
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}

                  {recentPayments.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No payment
                        transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PLANS */}

          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-950">
                Plans
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Current SEOMETRICHUB
                plans.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => {
                const activeCount =
                  activeSubscriptions.filter(
                    (subscription) =>
                      Number(
                        subscription.plan_id,
                      ) === Number(plan.id),
                  ).length;

                return (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-slate-950">
                          {plan.name}
                        </p>

                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {plan.code}
                        </p>
                      </div>

                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                        {activeCount} active
                      </span>
                    </div>

                    <p className="mt-5 text-3xl font-bold text-slate-950">
                      {formatMoney(
                        plan.price_inr,
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}