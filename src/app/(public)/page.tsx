import { PROJECT_NAME, PLAYSTORE_URL, APP_LOGO } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0613] text-white selection:bg-fuchsia-500/40">
      <Header />
      <Hero />
      <FeatureGrid />
      <DeepLinkSection />
      <CTASection />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[#0a0613]/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-300 via-pink-300 to-orange-200 bg-clip-text text-transparent">
            {PROJECT_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <a
            href="#features"
            className="hidden sm:inline-block text-sm text-white/70 hover:text-white px-3 py-2"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hidden sm:inline-block text-sm text-white/70 hover:text-white px-3 py-2"
          >
            How it works
          </a>
          <a
            href={PLAYSTORE_URL}
            target="_blank"
            rel="noopener"
            className="text-sm text-white border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 rounded-full px-4 py-1.5 transition-colors"
          >
            Get the app
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full bg-fuchsia-600/30 blur-[120px]" />
        <div className="absolute top-20 right-[-120px] h-[460px] w-[460px] rounded-full bg-orange-500/25 blur-[140px]" />
        <div className="absolute bottom-[-160px] left-1/3 h-[400px] w-[400px] rounded-full bg-violet-700/30 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live audio rooms · 24/7
        </span>

        <h1 className="mt-6 text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
          <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-orange-200 bg-clip-text text-transparent">
            Vibe. Talk. Live.
          </span>
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
          Hop into audio rooms, throw virtual gifts, and meet your tribe.
          {PROJECT_NAME} is where real-time conversations turn into a party.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={PLAYSTORE_URL}
            target="_blank"
            rel="noopener"
            className="group inline-flex items-center gap-3 rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-white/90 transition-colors shadow-lg shadow-fuchsia-500/20"
          >
            <PlayStoreIcon />
            <span className="text-left leading-tight">
              <span className="block text-[10px] uppercase tracking-widest text-black/60">
                Get it on
              </span>
              <span className="block text-base">Google Play</span>
            </span>
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium text-white/90 transition-colors"
          >
            See how it works
            <ArrowRight />
          </a>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-xs text-white/50">
          <Stat label="Live now" value="2.4k" />
          <Divider />
          <Stat label="Rooms today" value="18k" />
          <Divider />
          <Stat label="Countries" value="40+" />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-base font-bold text-white">{value}</div>
      <div className="uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-white/10" />;
}

function FeatureGrid() {
  const features = [
    {
      title: "Audio rooms that pop",
      desc: "Drop in, take the mic, and host parties up to thousands of listeners with crystal-clear audio.",
      icon: <MicIcon />,
      tint: "from-fuchsia-500/20 to-fuchsia-500/0",
    },
    {
      title: "Gifts & lucky bags",
      desc: "Send animated gifts, open lucky bags, and watch the room light up in real time.",
      icon: <GiftIcon />,
      tint: "from-orange-500/20 to-orange-500/0",
    },
    {
      title: "Find your tribe",
      desc: "Profiles, follows, levels, and badges turn every conversation into a community.",
      icon: <UsersIcon />,
      tint: "from-violet-500/20 to-violet-500/0",
    },
    {
      title: "Share anywhere",
      desc: "Universal links open profiles and rooms straight in the app — no friction, just vibes.",
      icon: <ShareIcon />,
      tint: "from-pink-500/20 to-pink-500/0",
    },
  ];

  return (
    <section
      id="features"
      className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28"
    >
      <SectionHeading
        eyebrow={`Why ${PROJECT_NAME}`}
        title="Built for the party generation"
        subtitle="Everything you need to host, hang out, and grow a following — in one app."
      />
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-white/20 hover:bg-white/[0.05] transition-colors overflow-hidden"
          >
            <div
              className={`absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br ${f.tint} blur-2xl pointer-events-none`}
            />
            <div className="relative">
              <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/90 group-hover:scale-105 transition-transform">
                {f.icon}
              </div>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeepLinkSection() {
  return (
    <section
      id="how-it-works"
      className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28"
    >
      <SectionHeading
        eyebrow="Universal links"
        title="One tap, you’re in"
        subtitle={`Profile and room links open the ${PROJECT_NAME} app instantly. No app? We’ll send you to the Play Store.`}
      />

      <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Step
          step="01"
          title="Tap a link"
          desc="Profile, room, or invite — links open the app right where you need them."
          accent="from-fuchsia-500 to-pink-500"
        />
        <Step
          step="02"
          title="Auto-route"
          desc="/profile/:id and /room/:id deep-link to the matching screen, signed in or not."
          accent="from-pink-500 to-orange-400"
        />
        <Step
          step="03"
          title="Fallback covered"
          desc="No app installed? We bounce you to the Play Store, then back into the room after install."
          accent="from-violet-500 to-fuchsia-500"
        />
      </div>
    </section>
  );
}

function Step({
  step,
  title,
  desc,
  accent,
}: {
  step: string;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 overflow-hidden">
      <div
        className={`absolute -top-1 left-0 h-1 w-24 rounded-full bg-gradient-to-r ${accent}`}
      />
      <div className="text-xs uppercase tracking-widest text-white/40">
        Step {step}
      </div>
      <div className="mt-2 text-xl font-bold">{title}</div>
      <p className="mt-2 text-sm text-white/60 leading-relaxed">{desc}</p>
    </div>
  );
}

function CTASection() {
  return (
    <section className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-600/30 via-pink-500/20 to-orange-400/20 p-10 sm:p-16 text-center">
        <div className="absolute inset-0 -z-0 opacity-30 pointer-events-none">
          <div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-fuchsia-400/40 blur-3xl" />
          <div className="absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-orange-400/40 blur-3xl" />
        </div>
        <h2 className="relative text-3xl sm:text-5xl font-black tracking-tight">
          Your next favorite room is{" "}
          <span className="bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
            one tap away.
          </span>
        </h2>
        <p className="relative mt-4 text-white/80 max-w-xl mx-auto">
          Join the {PROJECT_NAME} community and turn every chat into a celebration.
        </p>
        <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={PLAYSTORE_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-3 rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-white/90 transition-colors"
          >
            <PlayStoreIcon />
            <span className="text-left leading-tight">
              <span className="block text-[10px] uppercase tracking-widest text-black/60">
                Get it on
              </span>
              <span className="block text-base">Google Play</span>
            </span>
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium text-white/90 transition-colors"
          >
            Talk to us <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const legal = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/child-safety", label: "Child Safety" },
    { href: "/refund", label: "Refund Policy" },
    { href: "/delete-account", label: "Delete Account" },
  ];
  const company = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="border-t border-white/5 bg-black/30">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-300 via-pink-300 to-orange-200 bg-clip-text text-transparent">
              {PROJECT_NAME}
            </span>
          </div>
          <p className="mt-4 text-sm text-white/50 max-w-xs leading-relaxed">
            Live streaming &amp; audio rooms. Connect with creators and friends
            in real time, anywhere in the world.
          </p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-white/40">
            Legal
          </div>
          <ul className="mt-4 space-y-2.5">
            {legal.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-white/70 hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-white/40">
            Company
          </div>
          <ul className="mt-4 space-y-2.5">
            {company.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-white/70 hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <div>© {new Date().getFullYear()} {PROJECT_NAME}. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              Made with
              <HeartIcon />
              by Zaman
            </span>
            <div className="h-4 w-px bg-white/10" aria-hidden />
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/zamansheikh"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
              >
                <GithubIcon />
              </a>
              <a
                href="https://fb.com/zamansheikh.404"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-xs uppercase tracking-[0.25em] text-fuchsia-300/80">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight">
        {title}
      </h2>
      <p className="mt-4 text-base sm:text-lg text-white/60">{subtitle}</p>
    </div>
  );
}

/* --- Inline icon components (no extra dependencies) --- */

function LogoMark() {
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-fuchsia-500/20">
      <Image
        src={APP_LOGO}
        alt={`${PROJECT_NAME}`}
        width={36}
        height={36}
        priority
        className="h-full w-full object-cover"
      />
    </span>
  );
}

function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <defs>
        <linearGradient id="ps-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00C4FF" />
          <stop offset="1" stopColor="#0070FF" />
        </linearGradient>
        <linearGradient id="ps-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF3A44" />
          <stop offset="1" stopColor="#C31162" />
        </linearGradient>
        <linearGradient id="ps-c" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFCB1E" />
          <stop offset="1" stopColor="#FF8A00" />
        </linearGradient>
        <linearGradient id="ps-d" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0FBC5C" />
          <stop offset="1" stopColor="#00A044" />
        </linearGradient>
      </defs>
      <path d="M3.6 2.3c-.4.3-.6.8-.6 1.5v16.4c0 .7.2 1.2.6 1.5l9.3-9.7L3.6 2.3Z" fill="url(#ps-a)" />
      <path d="M16.6 8.6 13 12l3.7 3.4 4.3-2.5c1.2-.7 1.2-1.8 0-2.5l-4.4-2.5-.1.1Z" fill="url(#ps-c)" />
      <path d="M3.6 2.3 13 12l3.6-3.4L4.5 2c-.3-.1-.6-.1-.9.1l.1.2Z" fill="url(#ps-d)" />
      <path d="M3.6 21.7c.3.2.6.2.9.1l12.1-6.6L13 12l-9.4 9.7Z" fill="url(#ps-b)" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M5 12h14m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M8.5 8a2.5 2.5 0 1 1 0-5C14 3 12 8 12 8s-2-5 3.5-5a2.5 2.5 0 0 1 0 5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M2 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 14a5 5 0 0 1 6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="m8.2 10.8 7.6-3.6m-7.6 6 7.6 3.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-rose-400" aria-hidden>
      <path
        d="M12 21s-7.5-4.6-9.5-9.4C1.1 7.9 4.1 4 8 4c2.1 0 3.4 1.1 4 2 .6-.9 1.9-2 4-2 3.9 0 6.9 3.9 5.5 7.6C19.5 16.4 12 21 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path
        fill="currentColor"
        d="M12 .5C5.7.5.7 5.5.7 11.8c0 5 3.2 9.2 7.7 10.7.6.1.8-.2.8-.5v-2c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.3-1.6-1.3-1.6-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.5-.3-5.1-1.2-5.1-5.6 0-1.2.4-2.2 1.2-3-.1-.3-.5-1.5.1-3 0 0 .9-.3 3.1 1.1.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.4 3.1-1.1 3.1-1.1.6 1.5.2 2.7.1 3 .8.8 1.2 1.8 1.2 3 0 4.4-2.6 5.3-5.1 5.6.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.5-1.5 7.7-5.7 7.7-10.7C23.3 5.5 18.3.5 12 .5Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path
        fill="currentColor"
        d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"
      />
    </svg>
  );
}
