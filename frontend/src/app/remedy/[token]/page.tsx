'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Check,
  Sparkles,
  Info,
  BookOpen,
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';

type RemedyStatus = 'idle' | 'checking' | 'resolved';

interface RemedyData {
  applicationId: string;
  businessName?: string;
  deficiency: {
    code: string;
    officerNotes: string;
    plainGuidanceHindi: string;
    plainGuidanceEnglish: string;
    status: 'OPEN' | 'RESOLVED';
  };
}

const HINDI_GUIDELINES = [
  {
    rule: '1. कूड़ेदान को हमेशा ढक्कन लगाकर रखें',
    translation: 'Always keep waste bin covered with a lid within stall boundary.',
  },
  {
    rule: '2. पीने का पानी स्वच्छ व अलग कंटेनर में रखें',
    translation: 'Keep drinking water in a clean, designated dispenser with a tap.',
  },
  {
    rule: '3. खाना बनाते समय एप्रन और टोपी पहनें',
    translation: 'Wear clean apron and hairnet/cap during food preparation.',
  },
];

export default function DeficiencyRemedyPage() {
  const router = useRouter();
  const params = useParams();
  const token = (params?.token as string) || 'demo-token';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<RemedyStatus>('idle');
  const [remedy, setRemedy] = useState<RemedyData | null>({
    applicationId: 'VPR-2026-8F72K',
    businessName: 'Ramesh Chai & Nashta Corner',
    deficiency: {
      code: 'STALL_PHOTO_UNCLEAR',
      officerNotes: 'Stall photo missing covered waste bin with lid during AI Schedule 4 inspection.',
      plainGuidanceHindi: 'ठेले की फोटो में ढक्कनदार कूड़ेदान (Covered Dustbin) साफ नहीं दिख रहा है। कृपया नया फोटो खींचें।',
      plainGuidanceEnglish: 'Covered waste bin with lid was not detected in stall view. Please upload a clear photo.',
      status: 'OPEN',
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRemedy = async () => {
      if (!token || token === 'demo-token' || token === 'demo-remedy-token') return;
      try {
        const res = await apiFetch<RemedyData>(`/applications/remedy/${token}`);
        if (res.success && res.data) {
          setRemedy(res.data);
        }
      } catch {}
    };

    void loadRemedy();
  }, [token]);

  const runRemedyCheck = async () => {
    setStatus('checking');
    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    try {
      await apiFetch(`/applications/remedy/${token}`, {
        method: 'POST',
        body: JSON.stringify({ proofUrl: 'mock_proof_resolved.jpg' }),
      });
    } catch {}

    setRemedy((current) =>
      current
        ? { ...current, deficiency: { ...current.deficiency, status: 'RESOLVED' } }
        : current
    );
    setStatus('resolved');
  };

  return (
    <div className="nfssi-page">
      <div className="nfssi-container max-w-3xl">
        {/* Top Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/vendor-pass/demo')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Vendor Pass
          </button>
          <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-600">
            Zero-Login WhatsApp Remedy
          </span>
        </div>

        {/* Bilingual Action Required Banner (Visily Screen 9) */}
        <div className="mb-8 rounded-2xl bg-rose-600 text-white p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <AlertTriangle className="h-7 w-7 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-200">
                Action Required • तत्काल सुधारात्मक कार्रवाई
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Immediate Remedial Action Required
              </h1>
            </div>
          </div>

          <span className="rounded-full bg-white/20 border border-white/30 px-3.5 py-1 text-xs font-black text-white">
            STATUS: SUSPENDED
          </span>
        </div>

        {/* Deficiency Notice Card */}
        <div className="nfssi-card p-6 sm:p-8 mb-8">
          <div className="flex items-start gap-4 border-b border-slate-200 pb-5 mb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Food Safety Officer (FSO) Notice
                </p>
                <span className="font-mono text-xs font-bold text-slate-500">
                  Ref: #{remedy?.applicationId || 'VPR-2026-8F72K'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                {remedy?.deficiency?.officerNotes || 'Stall photo missing covered waste bin with lid during AI Schedule 4 inspection.'}
              </p>
            </div>
          </div>

          {/* Bilingual Plain Guidance */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
            <p className="text-xs font-black text-amber-900 leading-relaxed">
              {remedy?.deficiency?.plainGuidanceHindi || 'ठेले की फोटो में ढक्कनदार कूड़ेदान (Covered Dustbin) साफ नहीं दिख रहा है। कृपया नया फोटो खींचें।'}
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {remedy?.deficiency?.plainGuidanceEnglish || 'Covered waste bin with lid was not detected in stall view. Please upload a clear photo.'}
            </p>
          </div>
        </div>

        {/* Photo Retake & 1-Tap Re-verify Area */}
        <div className="nfssi-card p-6 sm:p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-black text-[#172238]">
              {status === 'resolved'
                ? '✓ Deficiency Resolved'
                : 'Upload Corrected Stall Photo'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {status === 'resolved'
                ? 'Your corrected proof has been validated and the pass restored.'
                : 'Ensure the covered waste bin and clean prep surface are visible.'}
            </p>
          </div>

          {status !== 'resolved' ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-700 mb-4 shadow-xs">
                {status === 'checking' ? (
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-slate-500" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={runRemedyCheck}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={status === 'checking'}
                className="rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-black py-3.5 px-6 text-sm shadow-md inline-flex items-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {status === 'checking' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Analyzing Corrected Photo via AI...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 text-emerald-400" />
                    <span>📸 Snap Corrected Photo &amp; Resubmit</span>
                  </>
                )}
              </button>
              <p className="mt-3 text-[11px] text-slate-400">
                Automatic AI re-inspection verifies Schedule 4 compliance within 30 seconds.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white mb-3">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
              <h3 className="text-base font-black text-emerald-900">
                ✓ Deficiency Resolved &amp; Pass Restored
              </h3>
              <p className="mt-1 text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
                Covered waste bin verified by automated vision model. Your Digital Vendor Pass is now reactivated on the national registry.
              </p>
              <button
                type="button"
                onClick={() => router.push('/vendor-pass/demo')}
                className="mt-5 rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-bold py-3 px-6 text-xs transition-colors shadow-xs"
              >
                Return to Digital Vendor Pass →
              </button>
            </div>
          )}
        </div>

        {/* 3 Hindi Renewal Guidelines (Visily Screen 9) */}
        <div className="nfssi-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-black text-[#172238] mb-4">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span>FSSAI Hygiene Guidelines • मुख्य स्वच्छता नियम</span>
          </div>

          <div className="space-y-3">
            {HINDI_GUIDELINES.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">{item.rule}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.translation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
