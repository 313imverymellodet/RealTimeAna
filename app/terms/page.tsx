import type { Metadata } from "next"
import Link from "next/link"
import { ContactLine, LegalPage, LegalSection } from "@/components/marketing/legal-page"
import { LEGAL } from "@/lib/legal"
import { BETA_PLAN } from "@/lib/plans"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The agreement between you and Housecount.",
}

export default function TermsPage() {
  const operator = LEGAL.operator || LEGAL.name

  return (
    <LegalPage title="Terms of Service">
      <LegalSection title="The agreement">
        <p>
          These terms are an agreement between you and {operator} (&quot;Housecount&quot;, &quot;we&quot;) for your use of the
          Housecount analytics service. By creating an account or installing the Housecount script you agree to them. If
          you use Housecount for an organisation, you agree on its behalf.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <ul className="space-y-1.5">
          <li>You must be at least 16 and give a working email address.</li>
          <li>Keep your password private. You are responsible for what happens under your account.</li>
          <li>Tell us promptly if you think someone else has accessed it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Using the service">
        <p>You may install Housecount only on websites you own or are authorised to manage. You agree not to:</p>
        <ul className="space-y-1.5">
          <li>Send false or automated traffic, or interfere with the service or other customers&apos; data.</li>
          <li>Try to identify individual visitors, or send us names, email addresses or other directly identifying details about them.</li>
          <li>Use the service to break the law or to help others do so.</li>
          <li>Resell the service or copy it, except as the law allows.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your responsibilities to your visitors">
        <p>
          You decide to measure your website, so you are responsible for doing it lawfully. That includes describing your
          use of analytics in your own privacy notice and meeting any consent rules that apply where you and your visitors
          are. Housecount is built to collect very little, but we cannot tell you what your local law requires. Our{" "}
          <Link href="/privacy" className="text-foreground underline underline-offset-4">
            Privacy Policy
          </Link>{" "}
          explains exactly what is collected.
        </p>
      </LegalSection>

      <LegalSection title="Your data">
        <p>
          The statistics collected for your websites are yours. You give us permission to store and process them to
          provide the service to you. You can delete a website or your whole account at any time, which permanently
          removes the related data.
        </p>
      </LegalSection>

      <LegalSection title="Beta service and price">
        <p>
          Housecount is in beta and is currently free, up to {BETA_PLAN.pageviewLimit.toLocaleString("en")} pageviews a
          month and {BETA_PLAN.siteLimit} websites per account. Page views above the limit are not recorded. Features may
          change, and things may break.
        </p>
        <p>
          We plan to introduce paid plans. We will give existing customers notice by email before any charge applies, and
          you will never be charged without choosing a paid plan.
        </p>
      </LegalSection>

      <LegalSection title="Availability and accuracy">
        <p>
          We work to keep Housecount running and its numbers right, but the service is provided &quot;as is&quot;, without
          warranties of any kind. Statistics are estimates: ad blockers, privacy settings, bot filtering and the daily
          reset of visitor identifiers all affect the counts. Revenue figures are whatever your own website reports and
          are not verified. Do not rely on Housecount as your only record for financial, legal or safety decisions.
        </p>
      </LegalSection>

      <LegalSection title="Ending the agreement">
        <p>
          You can stop at any time by deleting your account. We may suspend or close an account that breaks these terms or
          puts the service or other people at risk, and where reasonable we will tell you first. We may also stop offering
          the service, with notice by email.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          To the extent the law allows, Housecount is not liable for indirect or consequential losses, lost profits, or
          lost data arising from your use of the service, and our total liability to you is limited to the amount you
          paid us in the twelve months before the claim. Nothing in these terms limits liability that cannot legally be
          limited.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          We may update these terms. We will change the date at the top and, for significant changes, tell you by email
          before they take effect. Continuing to use Housecount after that means you accept the new terms.
        </p>
      </LegalSection>

      {LEGAL.governingLaw && (
        <LegalSection title="Governing law">
          <p>These terms are governed by the laws of {LEGAL.governingLaw}.</p>
        </LegalSection>
      )}

      <LegalSection title="Contact">
        <ContactLine purpose="For questions about these terms" />
      </LegalSection>
    </LegalPage>
  )
}
