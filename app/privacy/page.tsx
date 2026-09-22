import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
export const metadata = {
  title: "Privacy Policy | SEOMETRICHUB",
  description:
    "Read the SEOMETRICHUB Privacy Policy to understand how we collect, use, protect, and manage information when you use our SEO and AI marketing tools.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="mb-10">
                      <p>
              If you have questions about this Privacy Policy, your personal
              information, account data, or a privacy-related request, please
              contact us at{" "}
              <a
                href="mailto:support@seometrichub.com"
                className="font-semibold text-orange-600 hover:text-orange-700"
              >
                support@seometrichub.com
              </a>
              .
            </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mt-4 text-sm text-slate-500">
            Last updated: September 22, 2026
          </p>
        </div>

        <div className="space-y-10 text-base leading-8 text-slate-700">
          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              1. Introduction
            </h2>

            <p>
              SEOMETRICHUB provides website SEO analysis, keyword research,
              backlink and link analysis, AI-powered content generation, social
              media content generation, competitor analysis, Google Search
              Console integration, and related digital marketing tools.
            </p>

            <p className="mt-4">
              This Privacy Policy explains what information may be collected
              when you use SEOMETRICHUB, how that information may be used, and
              the choices available to you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              2. Information We May Collect
            </h2>

            <p>
              Depending on the features you use, we may process information
              such as website URLs submitted for analysis, keywords, topics,
              prompts, publicly available webpage content, technical SEO
              signals, and other information you voluntarily enter into our
              tools.
            </p>

            <p className="mt-4">
              When you connect a supported Google service, such as Google Search
              Console, we may receive authorization tokens and permitted account
              data required to provide that integration.
            </p>

            <p className="mt-4">
              We may also receive basic technical information such as browser
              type, device information, IP address, request logs, timestamps,
              error information, and usage information for security,
              troubleshooting, and service improvement.
            </p>
                        <p className="mt-4">
              When you create or use a SEOMETRICHUB account, we may process
              account information such as your email address, authentication
              information, subscription status, selected plan, usage limits,
              and tool usage associated with your account.
            </p>

            <p className="mt-4">
              When you purchase a paid plan, payment processing is handled by
              third-party payment providers such as PayU. SEOMETRICHUB may
              receive and store transaction-related information such as the
              selected plan, transaction identifier, payment status, amount,
              payment provider reference, and transaction date for billing,
              subscription activation, support, fraud prevention, and record
              keeping purposes.
            </p>

            <p className="mt-4">
              SEOMETRICHUB does not directly store your full card number, UPI
              PIN, banking password, or other payment credentials used to
              authorize a transaction through the payment provider.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              3. How We Use Information
            </h2>

            <p>We may use information to:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Provide and operate SEOMETRICHUB tools and features.</li>
              <li>Generate SEO reports, recommendations, and AI content.</li>
              <li>
                Display authorized Google Search Console performance
                information.
              </li>
              <li>Maintain security and prevent misuse or abuse.</li>
              <li>Diagnose technical problems and improve reliability.</li>
              <li>Improve the quality and usability of the platform.</li>
              <li>Comply with applicable legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              4. Google API Services
            </h2>

            <p>
              SEOMETRICHUB may use Google APIs when you explicitly connect your
              Google account to supported features.
            </p>

            <p className="mt-4">
              Access to Google account data is limited to the permissions
              granted by you and is used only to provide the requested
              functionality, such as displaying Google Search Console
              performance data.
            </p>

            <p className="mt-4">
              SEOMETRICHUB&apos;s use and transfer of information received from
              Google APIs will adhere to the Google API Services User Data
              Policy, including the Limited Use requirements where applicable.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              5. Authentication Tokens and Cookies
            </h2>

            <p>
              Some integrations may use cookies or similar technologies to
              maintain a secure connection between your browser and the
              requested service.
            </p>

            <p className="mt-4">
              Authentication tokens may be stored in secure, HTTP-only cookies
              or other protected server-side mechanisms where technically
              necessary to provide connected features.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              6. AI-Powered Features
            </h2>

            <p>
              Information submitted to AI-powered tools, such as topics,
              prompts, or content instructions, may be processed by third-party
              AI service providers solely as required to generate the requested
              output.
            </p>

            <p className="mt-4">
              You should not submit passwords, financial credentials, private
              authentication tokens, confidential personal records, or other
              highly sensitive information through AI content fields.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              7. Third-Party Services
            </h2>

            <p>
              SEOMETRICHUB may rely on third-party infrastructure and APIs to
              provide certain features. These providers may include hosting,
              analytics, search data, Google services, and AI service
              providers.
            </p>

            <p className="mt-4">
              Information processed by third-party providers may also be subject
              to their respective privacy policies and terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              8. Public Website Data
            </h2>

            <p>
              Some SEOMETRICHUB tools analyze publicly accessible website
              information, including HTML content, headings, metadata, links,
              images, technical signals, and other publicly available webpage
              elements.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              9. Data Retention
            </h2>

            <p>
              We aim to retain information only for as long as reasonably
              necessary to provide the service, maintain security, resolve
              technical issues, meet legal requirements, or support legitimate
              operational needs.
            </p>

            <p className="mt-4">
              Retention periods may vary depending on the type of information
              and the feature being used.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              10. Data Security
            </h2>

            <p>
              We use reasonable technical and organizational measures intended
              to protect information against unauthorized access, disclosure,
              alteration, misuse, or destruction.
            </p>

            <p className="mt-4">
              However, no online system, network transmission, or storage method
              can be guaranteed to be completely secure.
            </p>
          </section>

                    <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              11. Your Choices and Data Requests
            </h2>

            <p>
              You may choose not to use optional integrations. Where supported,
              you may revoke SEOMETRICHUB&apos;s access to your Google account
              through your Google Account permissions.
            </p>

            <p className="mt-4">
              You may request access to, correction of, or deletion of personal
              information associated with your SEOMETRICHUB account, subject to
              applicable legal, security, fraud-prevention, billing, and
              record-keeping requirements.
            </p>

            <p className="mt-4">
              To submit a privacy or account deletion request, contact{" "}
              <a
                href="mailto:support@seometrichub.com"
                className="font-semibold text-orange-600 hover:text-orange-700"
              >
                support@seometrichub.com
              </a>
              {" "}using the email address associated with your account. We may
              need to verify your identity before completing the request.
            </p>

            <p className="mt-4">
              Some transaction, billing, security, or compliance records may be
              retained where reasonably necessary or required by applicable
              law even after an account deletion request is completed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              12. Children&apos;s Privacy
            </h2>

            <p>
              SEOMETRICHUB is intended for business, marketing, SEO, and
              professional use and is not designed specifically for children.
              We do not knowingly seek to collect personal information from
              children through the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              13. Changes to This Privacy Policy
            </h2>

            <p>
              We may update this Privacy Policy as SEOMETRICHUB develops, new
              features are introduced, or legal and operational requirements
              change.
            </p>

            <p className="mt-4">
              The updated version will be published on this page with a revised
              &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              14. Contact
            </h2>

            <p>
              If you have questions about this Privacy Policy or the handling of
              information by SEOMETRICHUB, please contact us through the contact
              information published on the SEOMETRICHUB website.
            </p>
          </section>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}