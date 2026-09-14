"use client";

import { FormEvent, useState } from "react";

type Plan = {
  code: string;
  name: string;
  duration: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  button: string;
  href?: string;
  paid: boolean;
  popular: boolean;
  bestValue: boolean;
};

type PayUResponse = {
  success?: boolean;
  error?: string;
  paymentUrl?: string;
  fields?: Record<string, string>;
};

const plans: Plan[] = [
  {
    code: "free",
    name: "Free",
    duration: "Forever",
    price: "₹0",
    priceNote: "Free plan",
    description:
      "Get started with essential SEO and AI tools for testing and smaller websites.",
    features: [
      "3 Website SEO Audits / month",
      "5 Keyword Searches / month",
      "3 Backlink Analyses / month",
      "3 Competitor Analyses / month",
      "2 AI Articles / month",
      "5 Social Generations / month",
      "Basic Google Search Console access",
      "Limited report history",
    ],
    button: "Start Free",
    href: "/audit",
    paid: false,
    popular: false,
    bestValue: false,
  },
  {
    code: "pro_monthly",
    name: "Pro Monthly",
    duration: "1 Month",
    price: "₹999",
    priceNote: "per month",
    description:
      "A flexible monthly plan for freelancers, website owners and growing businesses.",
    features: [
      "50 Website SEO Audits / month",
      "100 Keyword Searches / month",
      "30 Backlink Analyses / month",
      "30 Competitor Analyses / month",
      "20 AI Articles / month",
      "50 Social Generations / month",
      "Full Google Search Console access",
      "Reports & history",
    ],
    button: "Upgrade",
    paid: true,
    popular: false,
    bestValue: false,
  },
  {
    code: "pro_3_months",
    name: "Pro 3 Months",
    duration: "3 Months",
    price: "₹2,499",
    priceNote: "₹833 / month",
    description:
      "More monthly usage with a lower effective monthly cost for regular users.",
    features: [
      "75 Website SEO Audits / month",
      "150 Keyword Searches / month",
      "50 Backlink Analyses / month",
      "50 Competitor Analyses / month",
      "30 AI Articles / month",
      "75 Social Generations / month",
      "Full Google Search Console access",
      "Reports & history",
    ],
    button: "Upgrade",
    paid: true,
    popular: false,
    bestValue: false,
  },
  {
    code: "pro_6_months",
    name: "Pro 6 Months",
    duration: "6 Months",
    price: "₹4,499",
    priceNote: "₹750 / month",
    description:
      "Higher monthly limits and better value for businesses using the platform consistently.",
    features: [
      "100 Website SEO Audits / month",
      "200 Keyword Searches / month",
      "75 Backlink Analyses / month",
      "75 Competitor Analyses / month",
      "40 AI Articles / month",
      "100 Social Generations / month",
      "Full Google Search Console access",
      "Reports & history",
    ],
    button: "Upgrade",
    paid: true,
    popular: false,
    bestValue: false,
  },
  {
    code: "pro_12_months",
    name: "Pro 12 Months",
    duration: "12 Months",
    price: "₹7,999",
    priceNote: "₹667 / month",
    description:
      "The best-value plan with the highest monthly limits for long-term growth.",
    features: [
      "150 Website SEO Audits / month",
      "300 Keyword Searches / month",
      "100 Backlink Analyses / month",
      "100 Competitor Analyses / month",
      "50 AI Articles / month",
      "150 Social Generations / month",
      "Full Google Search Console access",
      "Reports & history",
    ],
    button: "Upgrade",
    paid: true,
    popular: true,
    bestValue: true,
  },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCheckout(plan: Plan) {
    setSelectedPlan(plan);
    setFirstName("");
    setPhone("");
    setError("");
  }

  function closeCheckout() {
    if (loading) return;

    setSelectedPlan(null);
    setFirstName("");
    setPhone("");
    setError("");
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPlan) {
      return;
    }

    const cleanFirstName = firstName.trim();
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanFirstName) {
      setError("Please enter your first name.");
      return;
    }

    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payu/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planCode: selectedPlan.code,
          firstName: cleanFirstName,
          phone: cleanPhone,
        }),
      });

      const data = (await response.json()) as PayUResponse;

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        setError(data.error || "Unable to start payment.");
        return;
      }

      if (!data.paymentUrl || !data.fields) {
        setError("Invalid payment response. Please try again.");
        return;
      }

      const form = document.createElement("form");

      form.method = "POST";
      form.action = data.paymentUrl;
      form.style.display = "none";

      Object.entries(data.fields).forEach(([name, value]) => {
        const input = document.createElement("input");

        input.type = "hidden";
        input.name = name;
        input.value = String(value);

        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (checkoutError) {
      console.error("PayU checkout error:", checkoutError);

      setError("Unable to connect to PayU. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section
        id="pricing"
        className="relative overflow-hidden bg-white py-24 lg:py-32"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-[#F97316]">
              <span className="h-2 w-2 rounded-full bg-[#F97316]" />
              Simple Pricing
            </span>

            <h2 className="mt-6 text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
              Choose a Plan{" "}
              <span className="text-[#F97316]">Built for Growth</span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#64748B]">
              Start free and upgrade whenever you need higher SEO, content and
              marketing limits.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-5">
            {plans.map((plan) => (
              <div
                key={plan.code}
                className={`relative flex flex-col rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? "border-[#F97316] bg-white shadow-2xl shadow-orange-100"
                    : "border-slate-200 bg-white shadow-sm hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50"
                }`}
              >
                {plan.bestValue && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#F97316] px-4 py-1.5 text-xs font-black tracking-wide text-white shadow-lg shadow-orange-200">
                    BEST VALUE
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-[#0F172A]">
                        {plan.name}
                      </h3>

                      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#F97316]">
                        {plan.duration}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-4xl font-black tracking-tight text-[#0F172A]">
                      {plan.price}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#64748B]">
                      {plan.priceNote}
                    </p>
                  </div>

                  <p className="mt-5 min-h-[96px] text-sm leading-6 text-[#64748B]">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-7 border-t border-slate-100 pt-7">
                  <p className="text-sm font-black text-[#0F172A]">
                    Monthly limits
                  </p>

                  <ul className="mt-5 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-5 text-[#475569]"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-[#F97316]">
                          &#10003;
                        </span>

                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.paid ? (
                  <button
                    type="button"
                    onClick={() => openCheckout(plan)}
                    className="mt-8 flex w-full items-center justify-center rounded-xl bg-[#F97316] px-5 py-3.5 text-sm font-black text-white transition-all hover:bg-[#EA580C] hover:shadow-lg hover:shadow-orange-200"
                  >
                    {plan.button}
                    <span className="ml-2">-&gt;</span>
                  </button>
                ) : (
                  <a
                    href={plan.href}
                    className="mt-8 flex w-full items-center justify-center rounded-xl bg-[#F97316] px-5 py-3.5 text-sm font-black text-white transition-all hover:bg-[#EA580C] hover:shadow-lg hover:shadow-orange-200"
                  >
                    {plan.button}
                    <span className="ml-2">-&gt;</span>
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-orange-100 bg-orange-50/60 px-6 py-5 text-center">
            <p className="text-sm font-semibold leading-6 text-[#64748B]">
              All usage limits reset monthly. Longer-duration plans include
              higher monthly limits and discounted effective monthly pricing.
            </p>
          </div>
        </div>
      </section>

      {selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-8">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#F97316]">
                  PayU Secure Checkout
                </p>

                <h3 className="mt-2 text-2xl font-black text-[#0F172A]">
                  {selectedPlan.name}
                </h3>

                <p className="mt-1 text-sm font-semibold text-[#64748B]">
                  {selectedPlan.price} · {selectedPlan.duration}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCheckout}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xl font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close checkout"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCheckout} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="payu-first-name"
                  className="text-sm font-bold text-[#0F172A]"
                >
                  First Name
                </label>

                <input
                  id="payu-first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  disabled={loading}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="payu-phone"
                  className="text-sm font-bold text-[#0F172A]"
                >
                  Mobile Number
                </label>

                <input
                  id="payu-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                  maxLength={10}
                  disabled={loading}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-[#F97316] px-5 py-3.5 text-sm font-black text-white transition-all hover:bg-[#EA580C] hover:shadow-lg hover:shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Opening PayU..."
                  : `Pay ${selectedPlan.price} with PayU`}
              </button>

              <p className="text-center text-xs leading-5 text-[#64748B]">
                You will be redirected to PayU to complete your payment
                securely.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
