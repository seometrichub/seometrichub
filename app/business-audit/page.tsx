"use client";

import { useEffect, useState } from "react";

type GoogleAccount = {
  name: string;
  accountName?: string;
};

type GoogleLocation = {
  name: string;
  title?: string;
  websiteUri?: string;
  phoneNumbers?: {
    primaryPhone?: string;
  };
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
};

export default function BusinessAuditPage() {
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");

  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");

  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [googleConnected, setGoogleConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAccounts = async () => {
      setLoadingAccounts(true);
      setError("");

      try {
        const response = await fetch("/api/business-profile/accounts");
        const data = await response.json();

        if (!response.ok || !data.success) {
          setGoogleConnected(false);
          return;
        }

        setGoogleConnected(true);
        setAccounts(data.accounts || []);
      } catch (error) {
        console.error("Failed to load GBP accounts:", error);
        setError("Failed to load Google Business Profile accounts.");
      } finally {
        setLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, []);

  const handleAccountChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const accountName = event.target.value;

    setSelectedAccount(accountName);
    setLocations([]);
    setError("");

    if (!accountName) {
      return;
    }

    const accountId = accountName.split("/").pop();

    if (!accountId) {
      setError("Invalid Google Business Profile account.");
      return;
    }

    setLoadingLocations(true);

    try {
      const response = await fetch(
        `/api/business-profile/locations?accountId=${encodeURIComponent(
          accountId
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data?.error ||
            "Failed to load Google Business Profile locations."
        );
        return;
      }

      setLocations(data.locations || []);
    } catch (error) {
      console.error("Failed to load GBP locations:", error);
      setError("Failed to load Google Business Profile locations.");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleStartAudit = () => {
    const returnUrl = "/business-audit";

    const params = new URLSearchParams({
      returnUrl,
    });

    window.location.href = `/api/auth/google/business?${params.toString()}`;
  };

  const handleLocationChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const locationName = event.target.value;

    const selectedLocation = locations.find(
      (item) => item.name === locationName
    );

    if (!selectedLocation) {
      return;
    }

    setBusinessName(selectedLocation.title || "");

    const address = selectedLocation.storefrontAddress;

    if (address) {
      const addressParts = [
        ...(address.addressLines || []),
        address.locality,
        address.administrativeArea,
        address.postalCode,
      ].filter(Boolean);

      setLocation(addressParts.join(", "));
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <div className="mb-3 inline-flex rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-medium text-[#2563EB]">
            Google Business Audit
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#0F172A]">
            Optimize Your Google Business Profile
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#64748B]">
            Audit your Google Business Profile and discover opportunities to
            improve your local SEO visibility, profile completeness, reviews,
            and customer discovery.
          </p>
        </div>

        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#0F172A]">
              Start Your Business Audit
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Connect your Google Business Profile and select the business
              location you want to audit.
            </p>
          </div>

          {googleConnected && (
            <div className="mb-8 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-5">
              <h3 className="font-semibold text-[#166534]">
                Google Business Profile Connected
              </h3>

              <p className="mt-1 text-sm text-[#64748B]">
                Select your Google Business account and business location.
              </p>

              <div className="mt-5">
                <label
                  htmlFor="googleAccount"
                  className="mb-2 block text-sm font-medium text-[#334155]"
                >
                  Google Business Account
                </label>

                <select
                  id="googleAccount"
                  value={selectedAccount}
                  onChange={handleAccountChange}
                  disabled={loadingAccounts}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none"
                >
                  <option value="">
                    {loadingAccounts
                      ? "Loading accounts..."
                      : "Select Google Business Account"}
                  </option>

                  {accounts.map((account) => (
                    <option key={account.name} value={account.name}>
                      {account.accountName || account.name}
                    </option>
                  ))}
                </select>
              </div>

              {loadingLocations && (
                <p className="mt-4 text-sm text-[#64748B]">
                  Loading business locations...
                </p>
              )}

              {!loadingLocations && locations.length > 0 && (
                <div className="mt-5">
                  <label
                    htmlFor="googleLocation"
                    className="mb-2 block text-sm font-medium text-[#334155]"
                  >
                    Business Location
                  </label>

                  <select
                    id="googleLocation"
                    onChange={handleLocationChange}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none"
                  >
                    <option value="">
                      Select Business Location
                    </option>

                    {locations.map((locationItem) => (
                      <option
                        key={locationItem.name}
                        value={locationItem.name}
                      >
                        {locationItem.title || locationItem.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="businessName"
                className="mb-2 block text-sm font-medium text-[#334155]"
              >
                Business Name
              </label>

              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Example: ABC Real Estate"
                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-medium text-[#334155]"
              >
                Business Location
              </label>

              <input
                id="location"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Example: Visakhapatnam"
                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-xl border border-[#DBEAFE] bg-[#F8FBFF] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-[#0F172A]">
                {googleConnected
                  ? "Google Business Profile Connected"
                  : "Connect Google Business Profile"}
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                {googleConnected
                  ? "Your Google Business Profile is connected."
                  : "Connect your Google account to access your Business Profile."}
              </p>
            </div>

            {!googleConnected && (
              <button
                type="button"
                onClick={handleStartAudit}
                className="rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
              >
                Connect Google Business Profile
              </button>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Profile Completeness",
              description:
                "Check important business profile information.",
            },
            {
              title: "Reviews",
              description:
                "Analyze ratings and review opportunities.",
            },
            {
              title: "Local SEO",
              description:
                "Identify local search optimization opportunities.",
            },
            {
              title: "Performance",
              description:
                "Review available Google Business performance data.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-[#0F172A]">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                {item.description}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}