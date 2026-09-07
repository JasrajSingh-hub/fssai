import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Globe2, HelpCircle, Languages, Phone, ShieldCheck } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nfssi FSSAI Fast-Track',
  description: 'Government-aligned civic prototype for food-business compliance and digital vendor passes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] text-[#172238] antialiased selection:bg-emerald-600 selection:text-white">
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-xs backdrop-blur">
            <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-10">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172238] text-white shadow-xs">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </span>
                <span className="leading-tight">
                  <span className="block text-xl font-extrabold tracking-tight text-[#172238]">Nfssi</span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    FSSAI Fast-Track
                  </span>
                </span>
              </Link>

              <nav className="hidden items-center gap-8 text-sm font-bold text-slate-600 md:flex">
                <Link href="/" className="hover:text-[#172238] transition-colors">Home</Link>
                <Link href="/intake" className="hover:text-[#172238] transition-colors">Get Licensed</Link>
                <Link href="/verify-pass/demo" className="hover:text-[#172238] transition-colors">Verify Pass</Link>
                <Link href="#support" className="hover:text-[#172238] transition-colors">Support</Link>
              </nav>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="hidden h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:flex shadow-xs"
                >
                  <Languages className="h-4 w-4 text-slate-500" />
                  English
                </button>
                <Link
                  href="/intake"
                  className="rounded-lg bg-[#172238] px-5 py-2.5 text-xs font-black text-white shadow-xs transition hover:bg-slate-800"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </header>

          <main className="w-full flex-1">{children}</main>

          <footer id="support" className="border-t border-slate-200 bg-slate-50">
            <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 text-[#677284] md:grid-cols-3 lg:px-10">
              <div>
                <div className="flex items-center gap-2 text-lg font-extrabold text-[#1b2535]">
                  <ShieldCheck className="h-5 w-5" />
                  FSSAI Fast-Track
                </div>
                <p className="mt-4 max-w-sm text-sm leading-6">
                  Digitized government-aligned portal designed for Indian street food vendors to navigate FSSAI licensing and hygiene compliance.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Link href="#" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  FSSAI Guidelines
                </Link>
                <Link href="#" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Privacy Policy
                </Link>
                <Link href="#" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Terms of Service
                </Link>
                <Link href="#" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Vendor Support
                </Link>
              </div>
              <div className="space-y-3 text-sm md:justify-self-end">
                <p className="flex items-center gap-2 text-lg font-extrabold text-[#1b2535]">
                  <HelpCircle className="h-5 w-5" />
                  Need Assistance?
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  1800-11-2100 (Toll-Free)
                </p>
                <p className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4" />
                  Available 9 AM - 6 PM IST
                </p>
              </div>
            </div>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-[#d6deea] px-6 py-6 text-xs text-[#7b8797] md:flex-row md:items-center md:justify-between lg:px-10">
              <span>© 2026 FSSAI Fast-Track. All rights reserved.</span>
              <span>Government of India | Ministry of Health and Family Welfare</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
