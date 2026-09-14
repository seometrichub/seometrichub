"use client";

import { useSearchParams } from "next/navigation";

const PLAN_NAMES: Record<string, string> = {
  pro_monthly: "Pro Monthly",
  pro_3_months: "Pro 3 Months",
  pro_6_months: "Pro 6 Months",
  pro_12_months: "Pro 12 Months",
};

export default function PaymentStatus() {
  const searchParams = useSearchParams();

  const payment = searchParams.get("payment");
  const planCode = searchParams.get("plan");

  if (!payment) {
    return null;
  }

  const planName = planCode
    ? PLAN_NAMES[planCode] ?? "Pro Plan"
    : "Pro Plan";

  if (payment === "success") {
    return (
      <section className="border-b border-green-200 bg-green-50 px-5 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border border-green-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black text-green-800">
              Payment Successful
            </p>

            <p className="mt-1 text-sm leading-6 text-green-700">
              Your {planName} subscription is now active.
              You can view your plan and monthly usage from the dashboard.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
          >
            Go to Dashboard
          </a>
        </div>
      </section>
    );
  }

  if (payment === "processing") {
    return (
      <section className="border-b border-amber-200 bg-amber-50 px-5 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black text-amber-800">
              Payment Processing
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-700">
              We received your payment response and are checking your
              subscription status. Please check your dashboard shortly.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700"
          >
            Check Dashboard
          </a>
        </div>
      </section>
    );
  }

  if (
    payment === "subscription_error" ||
    payment === "subscription_not_found" ||
    payment === "transaction_finalize_error"
  ) {
    return (
      <section className="border-b border-orange-200 bg-orange-50 px-5 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black text-orange-800">
              Payment Received - Activation Pending
            </p>

            <p className="mt-1 text-sm leading-6 text-orange-700">
              Your payment response was received, but we could not fully
              confirm the subscription activation. Please check your dashboard
              before trying another payment.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1E293B]"
          >
            View Dashboard
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-red-200 bg-red-50 px-5 py-5 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-black text-red-800">
            Payment Unsuccessful
          </p>

          <p className="mt-1 text-sm leading-6 text-red-700">
            Your payment was not completed. Your current subscription has not
            been changed. You can try again from the pricing section.
          </p>
        </div>

        <a
          href="/#pricing"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800"
        >
          View Plans
        </a>
      </div>
    </section>
  );
}