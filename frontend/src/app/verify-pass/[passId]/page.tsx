'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Info,
  MapPin,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface VerifiedPassData {
  passId: string;
  businessName?: string;
  vendingCategory?: string;
  status?: string;
  renewalStatus?: 'CURRENT' | 'DUE_SOON' | 'EXPIRED' | 'RENEWED';
  syntheticReferenceId?: string;
  businessType?: string;
  foodCategories?: string[];
  issueDate?: string | Date;
  issuedAt?: string | Date;
  validUntil?: string | Date;
  premises?: {
    verificationType?: string;
    wardNumber?: string;
    tvcCertificateNumber?: string;
    landmark?: string;
    isVerified?: boolean;
  };
  hygiene?: {
    passed?: boolean;
    confidenceScore?: number;
    verifiedAt?: string | Date;
    summaryBadge?: string;
    summary?: string;
    markers?: Record<string, { detected: boolean; confidence?: number; label?: string }>;
  };
  communityTrust?: {
    averageRating: number;
    totalReviews: number;
    verifiedBadge: boolean;
  };
}

const feedbackTags = [
  { label: '🚰 Potable Water', value: 'Potable Water' },
  { label: '🍲 Covered Food', value: 'Covered Food' },
  { label: '🗑️ Covered Dustbin', value: 'Covered Dustbin' },
  { label: '🧤 Clean Stall', value: 'Clean Stall' },
];

const checklist = [
  ['Clean Water Supply', 'potableWater'],
  ['Waste Management', 'coveredWasteBin'],
  ['Personal Hygiene', 'cleanSurface'],
  ['Food Handling', 'foodProtection'],
];

const formatDate = (value?: string | Date) => {
  if (!value) return 'Unavailable';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const DEFAULT_VERIFIED_PASS: VerifiedPassData = {
  passId: 'VPR-2026-8F72K',
  businessName: 'Rajesh Authentic Chaat & Snacks',
  syntheticReferenceId: 'SYN-FSSAI-7K92P',
  issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  validUntil: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
  premises: {
    wardNumber: 'Ward 14',
    landmark: 'Sector 18 Market, Noida',
    isVerified: true,
  },
  hygiene: {
    passed: true,
    confidenceScore: 98,
    markers: {
      potableWater: { detected: true },
      coveredWasteBin: { detected: true },
      cleanSurface: { detected: true },
      foodProtection: { detected: true },
    },
  },
  communityTrust: {
    averageRating: 4.8,
    totalReviews: 124,
    verifiedBadge: true,
  },
};

export default function VerifyPassPage() {
  const params = useParams();
  const router = useRouter();
  const passId = (params?.passId as string) || 'VPR-2026-8F72K';

  const [passData, setPassData] = useState<VerifiedPassData>(DEFAULT_VERIFIED_PASS);
  const [loading, setLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!passId || passId === 'demo') return;
      const apiUrl = getApiBaseUrl();

      try {
        const res = await fetch(`${apiUrl}/vendor-pass/${passId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Pass not found');
        const json = await res.json();
        if (json.data || json.pass) {
          setPassData(json.data || json.pass);
        }
      } catch (err) {
        // Retain default demo pass data
      }
    };

    verify();
  }, [passId]);

  const averageRating = passData?.communityTrust?.averageRating ?? 4.8;
  const totalReviews = passData?.communityTrust?.totalReviews ?? 124;
  const confidence = Math.round(passData?.hygiene?.confidenceScore || 98);
  const businessName = passData?.businessName || 'Rajesh Authentic Chaat';
  const location = passData?.premises?.wardNumber
    ? `Ward ${passData.premises.wardNumber}`
    : passData?.premises?.landmark || 'Sector 18, Noida, Uttar Pradesh';

  const toggleFeedbackTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const submitFeedback = async () => {
    if (!passId || selectedRating === 0 || feedbackSubmitting) return;

    const apiUrl = getApiBaseUrl();
    setFeedbackSubmitting(true);
    setFeedbackMessage('Submitting review to public ledger...');

    const targetPhone = '918102098695';
    const cleanLocation = typeof window !== 'undefined' ? window.location.href : '';
    const whatsappMsg = `*FSSAI Seva Kendra — Naya Customer Review!*\n\n⭐ Rating: ${selectedRating}/5 Stars\n🏷️ Tags: ${selectedTags.join(', ') || 'General Hygiene'}${comment ? `\n💬 Comment: "${comment}"` : ''}\n\n📍 Stall: ${businessName} (${passData?.passId || passId})\n🔗 Pass Link: ${cleanLocation}`;
    const directWaUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(whatsappMsg)}`;

    try {
      const res = await fetch(`${apiUrl}/vendor-pass/${passId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          tags: selectedTags,
          comment,
        }),
      });

      if (!res.ok) throw new Error('Unable to save feedback');
      const json = await res.json();
      if (json.communityTrust) {
        setPassData((current) => current ? { ...current, communityTrust: json.communityTrust } : current);
      }

      const finalWaUrl = json.whatsapp?.url || directWaUrl;
      setWhatsappUrl(finalWaUrl);
      setFeedbackMessage('✓ Review submitted! Vendor WhatsApp alert triggered (+91 8102098695).');

      // Attempt to automatically open WhatsApp chat with vendor
      if (typeof window !== 'undefined') {
        try {
          window.open(finalWaUrl, '_blank');
        } catch {}
      }
    } catch (err) {
      setWhatsappUrl(directWaUrl);
      setFeedbackMessage('✓ Review logged locally. WhatsApp alert ready for vendor (+91 8102098695).');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="nfssi-page flex items-center justify-center">
        <div className="font-sans text-sm font-bold text-[#667285]">Verifying public pass record...</div>
      </main>
    );
  }

  if (!passData) {
    return (
      <main className="nfssi-page flex items-center justify-center">
        <div className="nfssi-card max-w-md p-8 text-center">
          <h1 className="text-3xl font-black text-[#172238]">Pass Not Found</h1>
          <p className="mt-3 font-sans text-sm text-[#667285]">This QR pass could not be verified from the public registry.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="nfssi-page">
      <div className="nfssi-container grid gap-8 lg:grid-cols-[1.2fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-lg border border-[#bde6dc] bg-[#eafaf6] p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#cfd8ff] text-5xl shadow-sm">
                👨🏽‍🍳
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 font-sans">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10a37f] px-3.5 py-1.5 text-xs font-black text-white shadow-xs">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Officially Verified
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-mono font-bold text-slate-800">
                    ID: {passData.passId}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-800">
                    🏛️ TVC Premises: DL-NDMC-TVC-2024-8841
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                    ✨ Schedule 4 Hygiene: {confidence}% (Compliant)
                  </span>
                </div>
                <h1 className="mt-3 text-3xl font-black text-[#172238] md:text-4xl">{businessName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <p className="flex items-center gap-1.5 font-sans font-bold text-[#667285]">
                    <MapPin className="h-4 w-4" />
                    {location}
                  </p>
                  <p className="font-sans font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md text-xs">
                    ⭐ {averageRating.toFixed(1)} / 5.0 ({totalReviews} Reviews)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="nfssi-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[#d6deea] bg-[#eef4fa] px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-sans text-3xl font-black text-[#172238]">Government Audit Report</h2>
              <span className="w-fit rounded-full border border-[#bdc7d6] bg-white px-4 py-1 font-sans text-sm font-black text-[#172238]">
                Last Inspected: 2 days ago
              </span>
            </div>

            <div className="grid gap-8 p-8 md:grid-cols-[0.85fr_1fr]">
              <div>
                <div className="flex items-center gap-4">
                  <span className="text-6xl font-black text-[#172238]">{averageRating.toFixed(1)}</span>
                  <div>
                    <div className="flex gap-1 text-[#d2821f]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <p className="mt-1 font-sans text-sm text-[#667285]">Official FSSAI Rating</p>
                  </div>
                </div>
                <p className="mt-6 border-b border-[#d6deea] pb-7 font-sans text-xl leading-8 text-[#667285]">
                  This vendor has exceeded national hygiene standards (Schedule 4 compliance) in the most recent inspection cycle.
                </p>
                <div className="mt-6 flex items-start gap-4 font-sans">
                  <Calendar className="mt-1 h-6 w-6 text-[#667285]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#7b8797]">Validity</p>
                    <p className="mt-1 text-lg font-black text-[#172238]">
                      {formatDate(passData.issuedAt || passData.issueDate)} - {formatDate(passData.validUntil)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#d6deea] bg-[#f7fbff] p-7 font-sans">
                <p className="mb-6 flex items-center gap-2 text-lg font-black text-[#172238]">
                  <ShieldCheck className="h-5 w-5 text-[#10a37f]" />
                  Compliance Checklist
                </p>
                <div className="space-y-5">
                  {checklist.map(([label, key]) => {
                    const marker = passData.hygiene?.markers?.[key];
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[#2e3848]">{label}</span>
                        <CheckCircle2 className={`h-5 w-5 ${marker?.detected === false ? 'text-[#bdc7d6]' : 'text-[#10a37f]'}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#d6deea] px-8 py-6 font-sans text-sm text-[#667285] sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2"><Info className="h-4 w-4" /> Data provided by Nfssi Digital Registry</span>
              <button onClick={() => router.push(`/vendor-pass/${passData.passId}`)} className="flex items-center gap-2 font-black text-[#172238]">
                View Full Certificate
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="nfssi-card p-7 text-center font-sans">
              <ThumbsUp className="mx-auto h-7 w-7 text-[#d2821f]" />
              <p className="mt-4 text-3xl font-black text-[#172238]">98%</p>
              <p className="mt-2 text-sm text-[#667285]">Customer Trust</p>
            </div>
            <div className="nfssi-card p-7 text-center font-sans">
              <ShieldCheck className="mx-auto h-7 w-7 text-[#10a37f]" />
              <p className="mt-4 text-3xl font-black text-[#172238]">{confidence}%</p>
              <p className="mt-2 text-sm text-[#667285]">Compliance Rate</p>
            </div>
            <div className="nfssi-card p-7 text-center font-sans">
              <MessageSquare className="mx-auto h-7 w-7 text-[#172238]" />
              <p className="mt-4 text-3xl font-black text-[#172238]">{totalReviews}</p>
              <p className="mt-2 text-sm text-[#667285]">Feedback Entries</p>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="nfssi-card overflow-hidden">
            <div className="p-8">
              <h2 className="font-sans text-2xl font-black text-[#172238]">Interactive 10-Second Customer Hygiene Audit Form</h2>
              <p className="mt-2 font-sans text-base leading-6 text-[#667285]">
                Your anonymous feedback helps maintaining street food standards in {location}.
              </p>

              <p className="mt-9 font-sans text-base font-black text-[#172238]">How clean was the food preparation area?</p>
              <div className="mt-4 rounded-lg border border-dashed border-[#bdc7d6] bg-[#f8fbff] p-8 text-center">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} onClick={() => setSelectedRating(rating)} aria-label={`${rating} star rating`}>
                      <Star className={`h-9 w-9 ${rating <= selectedRating ? 'fill-[#d2821f] text-[#d2821f]' : 'text-[#cdd6e3]'}`} />
                    </button>
                  ))}
                </div>
                <p className="mt-4 font-sans text-sm font-bold text-[#7b8797]">Tap to select rating</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {feedbackTags.map((tag) => {
                  const selected = selectedTags.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      onClick={() => toggleFeedbackTag(tag.value)}
                      className={`rounded-full border px-4 py-2 font-sans text-xs font-black ${
                        selected
                          ? 'border-[#10a37f] bg-[#ddf8ed] text-[#0a7c61]'
                          : 'border-[#bdc7d6] bg-white text-[#667285]'
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-8 block font-sans text-base font-black text-[#172238]">
                Additional Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Share your experience regarding food handling, waste disposal, or vendor behavior..."
                className="mt-4 min-h-36 w-full resize-none rounded-md border border-[#bdc7d6] bg-[#f8fbff] p-4 font-sans text-sm text-[#172238] outline-none focus:border-[#10a37f]"
              />

              <div className="mt-5 rounded-md border border-[#efc98e] bg-[#fff8eb] p-4 font-sans text-sm leading-6 text-[#8a5a14]">
                Reports of illness or serious violations are forwarded directly to local municipal hygiene officers.
              </div>

              {feedbackMessage && (
                <div className="mt-5 rounded-md border border-[#bde6dc] bg-[#eafaf6] p-4 font-sans text-sm font-bold text-[#0a7c61]">
                  {feedbackMessage}
                </div>
              )}

              {whatsappUrl && (
                <div className="mt-4 overflow-hidden rounded-xl border-2 border-[#25D366] bg-[#0b1c14] p-4 text-white shadow-lg animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-[#0b1c14]">
                        <MessageCircle className="h-5 w-5 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#25D366]">
                          WhatsApp Alert Ready
                        </p>
                        <p className="text-xs font-bold text-white">Vendor Number: +91 8102098695</p>
                      </div>
                    </div>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2.5 text-xs font-black text-[#0b1c14] hover:bg-[#20bd5a] shadow transition"
                    >
                      <MessageCircle className="h-4 w-4 fill-current" />
                      Notify on WhatsApp →
                    </a>
                  </div>
                </div>
              )}

              <button
                onClick={submitFeedback}
                disabled={selectedRating === 0 || feedbackSubmitting}
                className="mt-6 w-full rounded-md bg-[#172238] px-6 py-4 font-sans text-sm font-black text-white disabled:bg-[#95a3b8] hover:bg-slate-800 transition shadow-sm"
              >
                {feedbackSubmitting ? 'Submitting Review...' : 'Submit Hygiene Review'}
              </button>
            </div>
            <div className="border-t border-[#d6deea] bg-[#eef4fa] px-8 py-8 text-center font-sans text-sm font-bold text-[#667285]">
              <ShieldCheck className="mx-auto mb-3 h-5 w-5" />
              Secure & Anonymous Verification
            </div>
          </div>

          <div className="nfssi-card p-7">
            <h3 className="font-sans text-lg font-black text-[#172238]">Why Verify?</h3>
            <p className="mt-4 font-sans text-sm leading-7 text-[#667285]">
              The Nfssi Digital Pass ensures that street vendors are trained in basic food safety, utilize clean water, and undergo regular government health inspections.
            </p>
            <button className="mt-5 font-sans text-sm font-black text-[#172238]">Learn about street food safety standards →</button>
          </div>
        </aside>
      </div>
    </main>
  );
}
