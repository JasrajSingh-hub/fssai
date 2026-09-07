'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileCheck2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Users,
  type LucideIcon,
} from 'lucide-react';

const stats = [
  ['50K+', 'Licensed Vendors'],
  ['48hrs', 'Avg. Processing'],
  ['100%', 'Paperless Flow'],
  ['20+', 'Cities Active'],
] as const;

const journey = [
  {
    step: '01',
    title: 'Digital Intake',
    body: 'Provide your basic details via voice or text. No complex logins or paperwork required to start.',
    icon: Users,
    image: '/visily/page-02.jpg',
  },
  {
    step: '02',
    title: 'Hygiene Audit',
    body: 'Follow our visual photo-based guide to ensure your food cart meets Schedule 4 standards.',
    icon: ShieldCheck,
    image: '/visily/page-04.jpg',
  },
  {
    step: '03',
    title: 'Instant Certificate',
    body: 'Upload documents, simulate the statutory fee, and receive your Digital Vendor Pass instantly.',
    icon: FileCheck2,
    image: '/visily/page-06.jpg',
  },
];

interface FeatureItem {
  title: string;
  body: string;
  icon: LucideIcon;
}

const features: FeatureItem[] = [
  {
    title: 'Civic Support',
    body: 'Dedicated assistance for PM SVANidhi beneficiaries and municipal vendors.',
    icon: ShieldCheck,
  },
  {
    title: 'Voice-Enabled',
    body: 'Speak in Hinglish, Hindi, or regional languages to automatically complete forms.',
    icon: Smartphone,
  },
  {
    title: 'Instant QR Pass',
    body: 'Generate a verifiable digital QR badge for display at your food stall.',
    icon: QrCode,
  },
  {
    title: 'Auto-Renewals',
    body: 'Smart proactive notifications before your 1-year registration expires.',
    icon: Clock3,
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="nfssi-page">
      {/* Hero Section */}
      <section className="nfssi-container grid items-center gap-12 py-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="nfssi-step-label">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Official FSSAI Fast-Track Portal</span>
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-[#172238]">
            Modernize Your Food Stall with Official Certification
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600">
            Get your FSSAI license faster than ever. A zero-login, voice-enabled portal designed specifically for India&apos;s street food entrepreneurs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/intake')}
              className="nfssi-button inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold shadow-md hover:bg-slate-800"
            >
              Get Licensed Now
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push('/verify-pass/demo')}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-8 py-4 text-base font-bold text-[#172238] shadow-xs hover:bg-slate-50 transition-colors"
            >
              Verify a Vendor Pass
            </button>
          </div>

          <div className="mt-9 flex flex-wrap gap-6 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Government Aligned
            </span>
            <span className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" /> Digital-First &amp; Voice
            </span>
            <span className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-emerald-600" /> 15-Min Fast Processing
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
              <Image
                src="/visily/page-01.jpg"
                alt="FSSAI digital food stall certification demonstration"
                fill
                className="object-cover object-[center_12%]"
                priority
              />
            </div>
          </div>

          {/* Floating Trust Card */}
          <div className="absolute -bottom-6 left-6 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Registry Status</p>
                <p className="text-sm font-black text-[#172238]">Active Verified Merchant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navy Statistics Bar */}
      <section className="mt-16 rounded-2xl bg-[#172238] py-10 px-6 sm:px-10 text-white shadow-lg">
        <div className="nfssi-container grid gap-8 lg:grid-cols-[1.4fr_repeat(4,1fr)] items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-black text-white">Trusted by Authorities</p>
              <p className="text-xs text-slate-300 font-medium">Ministry of Health and Family Welfare Aligned</p>
            </div>
          </div>
          {stats.map(([value, label]) => (
            <div key={label} className="text-center border-t border-white/10 pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:border-white/10 lg:pl-4">
              <p className="text-3xl font-black text-amber-400">{value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step Journey Section */}
      <section className="nfssi-container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Simpler &amp; Faster</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black text-[#172238]">The Fast-Track Journey</h2>
          <p className="mt-4 text-base text-slate-600">
            No complex bureaucracy or middlemen. Our streamlined 3-phase flow ensures your stall meets national standards seamlessly.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {journey.map((item) => (
            <article key={item.title} className="nfssi-card relative flex flex-col justify-between overflow-hidden p-7">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#172238]">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-black text-slate-200">{item.step}</span>
                </div>
                <h3 className="mt-6 text-xl font-black text-[#172238]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="relative h-40 w-full">
                  <Image src={item.image} alt={item.title} fill className="object-cover object-top" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Why Choose Nfssi Fast-Track */}
      <section className="border-y border-slate-200 bg-slate-100/60 py-20">
        <div className="nfssi-container grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Core Advantages</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-[#172238]">Why choose Nfssi Fast-Track?</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-black text-[#172238]">{feat.title}</h3>
                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">{feat.body}</p>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => router.push('/intake')}
              className="mt-8 inline-flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-[#172238] shadow-xs hover:bg-slate-50"
            >
              Explore all features
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="nfssi-card p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Vendor Spotlight</p>
                <p className="mt-3 text-sm italic leading-relaxed text-slate-600">
                  &ldquo;The voice feature saved me so much time. I completed the form in Hindi in 3 minutes and got my verified pass.&rdquo;
                </p>
              </div>
              <p className="mt-4 text-sm font-black text-[#172238]">— Rajesh Kumar, Delhi</p>
            </div>
            <div className="nfssi-card row-span-2 overflow-hidden relative">
              <Image src="/visily/page-06.jpg" alt="Digital pass preview" fill className="object-cover object-top" />
            </div>
            <div className="rounded-2xl bg-emerald-600 p-7 text-white shadow-md flex flex-col justify-center">
              <p className="text-4xl sm:text-5xl font-black">98%</p>
              <p className="mt-2 text-xs font-black uppercase tracking-wider text-emerald-100">AI Verification Accuracy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="nfssi-container py-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-[#172238] px-8 py-16 text-center text-white shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-emerald-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl sm:text-4xl font-black">Ready to join the Hygiene-First revolution?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
            Start your application today and build trust with customers through an official FSSAI digital food hygiene badge.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              onClick={() => router.push('/intake')}
              className="rounded-lg bg-emerald-600 px-8 py-4 text-sm font-black text-white hover:bg-emerald-500 shadow-md transition-colors"
            >
              Start Registration
            </button>
            <button
              onClick={() => router.push('/verify-pass/demo')}
              className="rounded-lg border border-white/30 px-8 py-4 text-sm font-black text-white hover:bg-white/10 transition-colors"
            >
              Verify Existing Pass
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
