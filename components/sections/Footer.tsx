export default function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white">

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">

        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-2">

            <div className="text-xl font-black tracking-tight text-[#0F172A]">
              SEOMETRIC
              <span className="text-[#F97316]">
                HUB
              </span>
            </div>

            <p className="mt-4 max-w-md text-sm leading-6 text-[#64748B]">
              AI-powered SEO and digital marketing tools helping businesses
              rank higher, reach more customers and grow online.
            </p>

          </div>

          {/* Platform */}
          <div>

            <h4 className="font-bold text-[#0F172A]">
              Platform
            </h4>

            <div className="mt-4 space-y-3 text-sm">

              <a
                href="#tools"
                className="block text-[#64748B] transition hover:text-[#F97316]"
              >
                SEO Tools
              </a>

              <a
                href="#services"
                className="block text-[#64748B] transition hover:text-[#F97316]"
              >
                Services
              </a>

              <a
                href="#pricing"
                className="block text-[#64748B] transition hover:text-[#F97316]"
              >
                Pricing
              </a>

            </div>

          </div>

          {/* Company */}
          <div>

            <h4 className="font-bold text-[#0F172A]">
              Company
            </h4>

            <div className="mt-4 space-y-3 text-sm">

              <a
                href="#about"
                className="block text-[#64748B] transition hover:text-[#F97316]"
              >
                About
              </a>

              <a
                href="#contact"
                className="block text-[#64748B] transition hover:text-[#F97316]"
              >
                Contact
              </a>

              <a
                href="#"
                className="block text-[#64748B] transition hover:text-[#F97316]"
              >
                Privacy
              </a>

            </div>

          </div>

        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-[#E2E8F0] pt-8 text-sm text-[#94A3B8]">
          © 2026 SEOMETRICHUB. All rights reserved.
        </div>

      </div>

    </footer>
  );
}