"use client";

import { useState } from "react";

const navItems = [
  { label: "SEO Tools", href: "#tools" },
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

        {/* =========================
            LOGO
        ========================== */}
        <a
          href="/"
          onClick={() => setMenuOpen(false)}
          className="group flex items-center gap-3"
          aria-label="SEOMETRICHUB Home"
        >
          {/* Logo Mark */}
          <div
            className="
              flex h-11 w-11
              items-center justify-center
              rounded-xl
              bg-[#0F172A]
              shadow-sm
              transition-all duration-200
              group-hover:bg-[#F97316]
              group-hover:shadow-lg
              group-hover:shadow-orange-200
            "
          >
            <span className="text-xl font-black text-white">
              S
            </span>
          </div>

          {/* Logo Text */}
          <div className="text-lg font-black tracking-tight text-[#0F172A] sm:text-xl">
            SEOMETRIC
            <span className="text-[#F97316]">
              HUB
            </span>
          </div>
        </a>

        {/* =========================
            DESKTOP NAVIGATION
        ========================== */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="
                relative
                py-2
                text-sm
                font-semibold
                text-slate-600
                transition-colors
                hover:text-[#F97316]
                after:absolute
                after:bottom-0
                after:left-0
                after:h-0.5
                after:w-0
                after:bg-[#F97316]
                after:transition-all
                hover:after:w-full
              "
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* =========================
            DESKTOP ACTIONS
        ========================== */}
        <div className="hidden items-center gap-3 md:flex">

          <a
            href="#tools"
            className="
              rounded-lg
              px-4 py-2.5
              text-sm
              font-semibold
              text-[#0F172A]
              transition-colors
              hover:text-[#F97316]
            "
          >
            Login
          </a>

          <a
            href="#tools"
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-[#F97316]
              px-5 py-2.5
              text-sm
              font-bold
              text-white
              shadow-sm
              transition-all duration-200
              hover:-translate-y-0.5
              hover:bg-[#EA580C]
              hover:shadow-lg
              hover:shadow-orange-200
            "
          >
            Get Started
            <span>→</span>
          </a>

        </div>

        {/* =========================
            MOBILE MENU BUTTON
        ========================== */}
        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-lg
            border border-slate-200
            bg-white
            text-[#0F172A]
            transition-all
            hover:border-[#F97316]
            hover:text-[#F97316]
            md:hidden
          "
        >
          {menuOpen ? (
            <span className="text-2xl leading-none">
              ×
            </span>
          ) : (
            <span className="text-xl leading-none">
              ☰
            </span>
          )}
        </button>

      </div>

      {/* =========================
          MOBILE NAVIGATION
      ========================== */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">

          <nav className="mx-auto max-w-7xl px-5 py-4 sm:px-6">

            <div className="flex flex-col">

              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="
                    border-b
                    border-slate-100
                    py-4
                    text-sm
                    font-semibold
                    text-slate-700
                    transition-colors
                    hover:text-[#F97316]
                  "
                >
                  {item.label}
                </a>
              ))}

              {/* Mobile Login */}
              <a
                href="#tools"
                onClick={() => setMenuOpen(false)}
                className="
                  mt-4
                  rounded-lg
                  border border-slate-200
                  px-5 py-3
                  text-center
                  text-sm
                  font-semibold
                  text-[#0F172A]
                  transition
                  hover:border-[#F97316]
                  hover:text-[#F97316]
                "
              >
                Login
              </a>

              {/* Mobile CTA */}
              <a
                href="#tools"
                onClick={() => setMenuOpen(false)}
                className="
                  mt-3
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-[#F97316]
                  px-5 py-3
                  text-center
                  text-sm
                  font-bold
                  text-white
                  transition-all
                  hover:bg-[#EA580C]
                "
              >
                Get Started
                <span>→</span>
              </a>

            </div>

          </nav>

        </div>
      )}

    </header>
  );
}