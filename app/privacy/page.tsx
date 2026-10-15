import type { Metadata } from "next"
import Link from "next/link"
import { ContactLine, LegalPage, LegalSection } from "@/components/marketing/legal-page"
import { LEGAL } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Housecount collects, why, and what it never collects.",
}

export default function PrivacyPage() {
  const operator = LEGAL.operator || LEGAL.name

  return (
    <LegalPage title="Privacy Policy">
      <LegalSection title="The short version">
        <ul className="space-y-1.5">
          <li>Housecount measures visits to websites without cookies and without storing anything in a visitor&apos;s browser.</li>
          <li>We never store a visitor&apos;s IP address, and we cannot follow a visitor across websites or, unless a site identifies its own signed-in member, across days.</li>
          <li>We do not sell personal data and we do not use it for advertising.</li>
          <li>You can delete your account, and everything collected for your sites, at any time from Settings.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Who this covers">
        <p>
          {operator} (&quot;Housecount&quot;, &quot;we&quot;) runs the Housecount analytics service. This policy covers two
          groups of people:
        </p>
        <ul className="space-y-1.5">
          <li><strong>Customers</strong>: people who create a Housecount account to measure their own website.</li>
          <li><strong>Visitors</strong>: people who visit a website that has the Housecount script installed.</li>
        </ul>
        <p>
          For visitor data, the website owner decides what to measure and why. We process that data on the owner&apos;s
          behalf and only to provide the service to them.
        </p>
      </LegalSection>

      <LegalSection title="What we collect about visitors">
        <p>When someone views a page on a site that uses Housecount, we record:</p>
        <ul className="space-y-1.5">
          <li>The path of the page, without its query string.</li>
          <li>The hostname of the site that linked to it, and campaign tags (utm_source, utm_medium, utm_campaign) if the link carried them.</li>
          <li>Device type, browser and operating system, read from the browser&apos;s user agent.</li>
          <li>Country, region and city, worked out from the IP address, with coordinates rounded to roughly 11 km.</li>
          <li>How long the page was visible, and how far down it the visitor scrolled.</li>
          <li>Goals the site reports, such as a signup, and any amount of money the site attaches to them.</li>
        </ul>
        <p>
          To count unique visitors we create an anonymous identifier: a one-way hash of the website, the IP address and
          the user agent, mixed with a random value that is replaced and permanently deleted every day. The IP address is
          used in memory to create this hash and to look up location. It is then discarded and is never written to our
          database. Because the random value is destroyed daily, the same person produces a different, unrelated
          identifier the next day.
        </p>
        <p>
          If a website chooses to identify its own signed-in members, it sends us an ID of its choosing. We store only a
          one-way hash of that ID, which lets the site see one member&apos;s visits together over time. We never receive
          the member&apos;s name or email address unless the site uses one as the ID, which we advise against.
        </p>
      </LegalSection>

      <LegalSection title="What we never collect about visitors">
        <ul className="space-y-1.5">
          <li>No cookies, localStorage or other browser storage.</li>
          <li>No stored IP addresses.</li>
          <li>No names, email addresses, form contents, keystrokes or screen recordings.</li>
          <li>No tracking across different websites.</li>
          <li>Nothing at all from browsers that send Do Not Track or Global Privacy Control.</li>
        </ul>
      </LegalSection>

      <LegalSection title="What we collect about customers">
        <ul className="space-y-1.5">
          <li>Your email address and a securely hashed password, or your profile from Google or GitHub if you sign in that way.</li>
          <li>The websites you add and your settings.</li>
          <li>If you connect a Bluesky or Mastodon account: its public handle, and the public profile details, follower counts and posts we fetch from that network.</li>
          <li>A sign-in session, including the IP address and browser used to sign in, so we can keep your account secure.</li>
        </ul>
        <p>
          The Housecount application itself sets one cookie when you sign in, to keep you signed in. It is essential to
          the service and is not used for tracking. This is separate from the tracking script, which sets none.
        </p>
      </LegalSection>

      <LegalSection title="How we use it">
        <ul className="space-y-1.5">
          <li>To show website owners statistics about their own sites.</li>
          <li>To run, secure and improve the service, including filtering automated traffic and preventing abuse.</li>
          <li>To email customers about their account: confirming an address, resetting a password, and a weekly summary that can be switched off in Settings or from any summary email.</li>
        </ul>
        <p>We do not sell personal data, share it with advertisers, or use it to build advertising profiles.</p>
      </LegalSection>

      <LegalSection title="Who else handles the data">
        <p>We use a small number of service providers, who may only process data on our instructions:</p>
        <ul className="space-y-1.5">
          <li><strong>Railway</strong>, which hosts the application and its database.</li>
          <li><strong>Bluesky and Mastodon servers</strong>, which we ask for public account information only when you connect an account. We send them the handle and nothing else.</li>
          <li><strong>Resend</strong>, which delivers our emails to customers.</li>
        </ul>
        <p>
          These providers may process data in the United States and other countries. We may also disclose information
          when the law requires it.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Website statistics are kept for as long as the website remains in an account. Deleting a website deletes its
          statistics. Deleting an account deletes the account, its websites and all of their statistics. Daily random
          values used for visitor identifiers are deleted after one day.
        </p>
      </LegalSection>

      <LegalSection title="Your choices and rights">
        <ul className="space-y-1.5">
          <li><strong>Customers</strong> can delete a website or their whole account from Settings at any time.</li>
          <li><strong>Visitors</strong> can turn on Do Not Track or Global Privacy Control in their browser to be left out entirely.</li>
          <li>Depending on where you live, you may have rights to access, correct or delete personal data about you, or to object to its use.</li>
        </ul>
        <p>
          Because visitor identifiers are anonymous and change daily, we usually cannot tell which records relate to a
          particular visitor. Requests about a specific website are best sent to that website&apos;s owner, and we will
          help them respond.
        </p>
        <ContactLine purpose="To make a request or ask a question about privacy" />
      </LegalSection>

      <LegalSection title="Children">
        <p>Housecount is a tool for website owners and is not directed at children. Accounts are for people aged 16 or over.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If we change this policy we will update the date at the top, and for significant changes we will tell customers
          by email. See also our{" "}
          <Link href="/terms" className="text-foreground underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          and the{" "}
          <Link href="/docs#data" className="text-foreground underline underline-offset-4">
            technical description of what the script collects
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
