import { createFileRoute } from "@tanstack/react-router";

import { PageIntro, PageShell } from "@/components/site/PageShell";
import { CONTACT_EMAIL, PRIVACY_UPDATED, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy | a4africa.org" },
      {
        name: "description",
        content: "How a4africa.org collects, uses, and protects your personal information.",
      },
      { property: "og:url", content: `${SITE_URL}/privacy` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/privacy` }],
  }),
  component: PrivacyPage,
});

const sections: { title: string; body: string[] }[] = [
  {
    title: "Who we are",
    body: [
      'a4africa.org ("we", "us") is an online publication that shares positive stories from across Africa. This policy explains what personal information we collect when you use the site, why, and the choices you have. We aim to handle your information in line with the Nigeria Data Protection Act 2023 and other applicable data protection laws.',
    ],
  },
  {
    title: "What we collect",
    body: [
      "Account details: your name, email address, and password (stored securely in encrypted form). If you sign in with Google, we receive your name, email address, and profile picture from Google.",
      "Stories you submit: the title, country, place, category, story text, and the photo you upload.",
      "Contact messages: your name, email address, and the message you send us through the contact form.",
      "Basic technical data: like most websites, our hosting providers keep short-lived logs (such as IP address and browser type) to keep the service secure and working.",
    ],
  },
  {
    title: "How we use it",
    body: [
      "To run your account and let you submit, edit, and track your stories.",
      "To review submissions and publish approved stories. Published stories show your display name as the contributor, along with the story and photo.",
      "To reply to messages you send us.",
      "To protect the site from spam, abuse, and security threats.",
      "We do not sell your personal information, and we do not use it for advertising.",
    ],
  },
  {
    title: "What is public",
    body: [
      "Only stories approved by an editor are public. Pending and rejected stories, photos attached to them, your email address, and your contact messages are never shown publicly.",
    ],
  },
  {
    title: "Who we share it with",
    body: [
      "We use trusted service providers to run the site: Supabase (database, sign-in, and photo storage), Vercel (website hosting), and Google (only if you choose Google sign-in). These providers process data on our behalf and may store it outside Nigeria, with safeguards in place. We may also disclose information if required by law.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "We keep your account and stories for as long as your account is active. Published stories may remain online after you close your account unless you ask us to remove them. Contact messages are kept for up to two years and then deleted.",
    ],
  },
  {
    title: "Your rights",
    body: [
      `You can ask us to access, correct, or delete your personal information, to withdraw a published story, or to object to how we use your information. You can withdraw pending stories yourself from your submissions page. For anything else, email ${CONTACT_EMAIL} and we will respond within 30 days. You also have the right to complain to the Nigeria Data Protection Commission.`,
    ],
  },
  {
    title: "Children",
    body: [
      "You must be at least 13 years old to create an account. If you share a story that shows children, make sure a parent or guardian has agreed to it being published.",
    ],
  },
  {
    title: "Cookies and local storage",
    body: [
      "We only use your browser's storage to keep you signed in. We do not use advertising or tracking cookies.",
    ],
  },
  {
    title: "Changes to this policy",
    body: ["If we make significant changes, we will update this page and the date below."],
  },
];

function PrivacyPage() {
  return (
    <PageShell width="max-w-[1100px]">
      <main>
        <PageIntro eyebrow="Privacy policy" title="Your information, handled with care.">
          <p>
            Last updated: {PRIVACY_UPDATED}. Questions? Email{" "}
            <a
              className="font-medium text-clay underline-offset-4 hover:underline"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </PageIntro>
        <div className="max-w-3xl py-12 sm:py-16">
          {sections.map((section) => (
            <section key={section.title} className="mb-10">
              <h2 className="font-display text-2xl font-semibold">{section.title}</h2>
              <div className="mt-3 grid gap-3 text-[15px] leading-relaxed text-ink/70">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
