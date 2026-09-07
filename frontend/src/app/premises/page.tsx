'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronLeft,
  MapPin,
  ScanLine,
  Store,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Info,
  Building2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import StepNavigation from '../../components/StepNavigation';
import { apiFetch } from '../../lib/api';

type PremisesType = 'TVC_CERTIFICATE' | 'PM_SVANIDHI' | 'GEOTAG_FALLBACK';

interface PremisesState {
  type: PremisesType;
  tvcId: string;
  ward: string;
  coordinates: [number, number] | [];
  landmark: string;
  issuingMunicipality: string;
  loanApplicationNumber: string;
}

const DEFAULT_STATE: PremisesState = {
  type: 'TVC_CERTIFICATE',
  tvcId: 'DL-NDMC-TVC-2024-8841',
  ward: 'Ward 14 - Sector 18 Market',
  coordinates: [28.6315, 77.2167],
  landmark: 'Sector 18 North Vending Zone',
  issuingMunicipality: 'New Delhi Municipal Council (NDMC)',
  loanApplicationNumber: 'PMSV-2026-9921',
};

export default function PremisesPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState('demo-app-101');
  const [state, setState] = useState<PremisesState>(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const appId = params.get('applicationId') || localStorage.getItem('activeApplicationId') || 'demo-app-101';
      setApplicationId(appId);

      const cached = sessionStorage.getItem('premises_data');
      if (cached) {
        try {
          setState(JSON.parse(cached));
        } catch {}
      }
    }
  }, []);

  const persist = async (next: PremisesState) => {
    setState(next);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('premises_data', JSON.stringify(next));
    }

    try {
      await apiFetch(`/applications/${applicationId}/premises`, {
        method: 'PATCH',
        body: JSON.stringify({
          verificationType: next.type,
          tvcCertificateNumber: next.type === 'TVC_CERTIFICATE' ? next.tvcId || undefined : undefined,
          wardNumber: next.ward || undefined,
          issuingMunicipality: next.issuingMunicipality || undefined,
          loanApplicationNumber:
            next.type === 'PM_SVANIDHI'
              ? next.loanApplicationNumber || next.tvcId || undefined
              : undefined,
          coordinates:
            next.coordinates.length === 2
              ? { latitude: next.coordinates[0], longitude: next.coordinates[1] }
              : undefined,
          landmark: next.landmark || next.ward || undefined,
        }),
      });
    } catch {}
  };

  const chooseTab = (type: PremisesType) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
    }, 400);

    if (type === 'TVC_CERTIFICATE') {
      persist({
        ...state,
        type: 'TVC_CERTIFICATE',
        tvcId: state.tvcId || 'DL-NDMC-TVC-2024-8841',
        issuingMunicipality: 'New Delhi Municipal Council (NDMC)',
      });
    } else if (type === 'PM_SVANIDHI') {
      persist({
        ...state,
        type: 'PM_SVANIDHI',
        loanApplicationNumber: state.loanApplicationNumber || 'PMSV-2026-9921',
      });
    } else {
      persist({
        ...state,
        type: 'GEOTAG_FALLBACK',
        coordinates: [28.6315, 77.2167],
        landmark: 'Sector 18 Authorized Vending Cluster',
      });
    }
  };

  const handleContinue = async () => {
    setSaving(true);
    await persist(state);
    setSaving(false);
    router.push(`/hygiene?applicationId=${applicationId}`);
  };

  return (
    <div className="nfssi-page">
      <div className="nfssi-container">
        {/* 5-Step Horizontal Stepper */}
        <StepNavigation currentStep={2} applicationId={applicationId} />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172238]">Premises Compliance</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Step 2 of 5: Establish lawful street vending spot via Town Vending Committee (TVC) certificate or GPS Geotag.
            </p>
          </div>
          <button
            onClick={() => router.push(`/intake?applicationId=${applicationId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Intake
          </button>
        </div>

        {/* 3 Verification Mode Tabs (Visily Screen 4) */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => chooseTab('TVC_CERTIFICATE')}
            className={`flex items-center gap-3 rounded-xl p-4 border text-left transition-all ${
              state.type === 'TVC_CERTIFICATE'
                ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              state.type === 'TVC_CERTIFICATE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[#172238]">TVC Certificate</p>
              <p className="text-[11px] text-slate-500">Municipal vending card</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => chooseTab('PM_SVANIDHI')}
            className={`flex items-center gap-3 rounded-xl p-4 border text-left transition-all ${
              state.type === 'PM_SVANIDHI'
                ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              state.type === 'PM_SVANIDHI' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[#172238]">PM SVANidhi ID</p>
              <p className="text-[11px] text-slate-500">Central urban loan ID</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => chooseTab('GEOTAG_FALLBACK')}
            className={`flex items-center gap-3 rounded-xl p-4 border text-left transition-all ${
              state.type === 'GEOTAG_FALLBACK'
                ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              state.type === 'GEOTAG_FALLBACK' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[#172238]">Live GPS Geotag</p>
              <p className="text-[11px] text-slate-500">Fallback for lagging survey</p>
            </div>
          </button>
        </div>

        {/* Main Content: Left Column Form, Right Column Status & Verification Logs */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Left Column: Verification Data Entry & Upload */}
          <div className="space-y-6">
            <div className="nfssi-card p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
                <div>
                  <h2 className="text-lg font-black text-[#172238]">
                    {state.type === 'TVC_CERTIFICATE'
                      ? 'Town Vending Certificate (TVC) Details'
                      : state.type === 'PM_SVANIDHI'
                      ? 'PM SVANidhi Beneficiary Details'
                      : 'GPS Coordinates & Spot Verification'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official municipal records confirm your stall location is in an authorized vending zone.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-800">
                  Authorized Zone
                </span>
              </div>

              {state.type === 'TVC_CERTIFICATE' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      TVC Certificate / Certificate of Vending (CoV) Number *
                    </label>
                    <input
                      type="text"
                      value={state.tvcId}
                      onChange={(e) => persist({ ...state, tvcId: e.target.value })}
                      placeholder="e.g. DL-NDMC-TVC-2024-8841"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Issuing Municipality *
                      </label>
                      <input
                        type="text"
                        value={state.issuingMunicipality}
                        onChange={(e) => persist({ ...state, issuingMunicipality: e.target.value })}
                        placeholder="e.g. NDMC / Municipal Corporation"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Ward &amp; Zone Number *
                      </label>
                      <input
                        type="text"
                        value={state.ward}
                        onChange={(e) => persist({ ...state, ward: e.target.value })}
                        placeholder="e.g. Ward 14 - Sector 18"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Upload Certificate Scan / Card Photo
                    </label>
                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center hover:bg-slate-100/60 transition-colors cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-slate-700">
                        Drag &amp; drop your municipal vending card, or <span className="text-emerald-600">Browse file</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, PDF up to 5MB</p>
                    </div>
                  </div>
                </div>
              )}

              {state.type === 'PM_SVANIDHI' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      PM SVANidhi Loan / Vending Application ID *
                    </label>
                    <input
                      type="text"
                      value={state.loanApplicationNumber}
                      onChange={(e) => persist({ ...state, loanApplicationNumber: e.target.value })}
                      placeholder="e.g. PMSV-2026-9921"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Registered Vending Cluster / Market *
                    </label>
                    <input
                      type="text"
                      value={state.landmark}
                      onChange={(e) => persist({ ...state, landmark: e.target.value })}
                      placeholder="e.g. Sector 18 North Vending Zone"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {state.type === 'GEOTAG_FALLBACK' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-[#172238]">GPS Coordinates Detected</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        High Accuracy (±3m)
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-600">
                      Latitude: 28.6315° N, Longitude: 77.2167° E
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Permanent Landmark Description *
                    </label>
                    <input
                      type="text"
                      value={state.landmark}
                      onChange={(e) => persist({ ...state, landmark: e.target.value })}
                      placeholder="e.g. In front of Gate 2, Metro Station Vending Spot"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Instant Demo Presets */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quick Demo Test Presets
                </span>
                <span className="text-[11px] font-bold text-emerald-600">1-Tap Fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => chooseTab('TVC_CERTIFICATE')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-slate-100 transition-colors"
                >
                  <p className="text-xs font-bold text-[#172238]">Preset: Municipal TVC</p>
                  <p className="text-[11px] text-slate-500 truncate">DL-NDMC-TVC-2024-8841</p>
                </button>
                <button
                  type="button"
                  onClick={() => chooseTab('GEOTAG_FALLBACK')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-slate-100 transition-colors"
                >
                  <p className="text-xs font-bold text-[#172238]">Preset: Live Geotag</p>
                  <p className="text-[11px] text-slate-500 truncate">28.6315° N, 77.2167° E</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: 45% Compliance Progress, OCR Verification Logs, Delay Alert */}
          <div className="space-y-6">
            {/* 45% Compliance Progress Card (Visily Screen 4) */}
            <div className="nfssi-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Overall Compliance Score
                </span>
                <span className="text-lg font-black text-emerald-600">45%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mb-4">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 w-[45%]" />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Basic Intake: 100% Completed</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mt-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Premises Location: Verified in Real Time</span>
              </div>
            </div>

            {/* Verification Logs Card */}
            <div className="nfssi-card p-6">
              <h3 className="text-sm font-black text-[#172238] mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Live Municipal Verification Logs</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg bg-emerald-50/70 p-3 border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-900">Certificate Matched with Database</p>
                    <p className="text-emerald-700 text-[11px] mt-0.5">
                      TVC #{state.tvcId || 'DL-NDMC-8841'} active in Urban Registry
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-emerald-50/70 p-3 border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-900">Designated Vending Zone Verified</p>
                    <p className="text-emerald-700 text-[11px] mt-0.5">
                      {state.ward || 'Sector 18 Market'} designated as clean petty vending zone
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-emerald-50/70 p-3 border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-900">Schedule 4 Eligibility Confirmed</p>
                    <p className="text-emerald-700 text-[11px] mt-0.5">
                      FSS Act 2006 Section 31 basic registration applicable
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delay Warning Alert (Visily Screen 4) */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black">Municipal Compliance Note</p>
                  <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                    Please ensure your cart operates within the demarcated municipal vending line. Stalls obstructing pedestrian traffic may face municipal review.
                  </p>
                </div>
              </div>
            </div>

            {/* Municipal Help Box (Visily Screen 4) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-black text-[#172238] mb-1.5">
                <HelpCircle className="h-4 w-4 text-slate-500" />
                <span>Municipal Assistance</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Don&apos;t have your TVC number handy? Call your local Ward Vending Officer toll-free at <strong>1800-11-2100</strong>.
              </p>
            </div>

            {/* Next Step Button */}
            <button
              onClick={handleContinue}
              disabled={saving}
              className="w-full rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-black py-4 px-6 text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Saving Premises Compliance...</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Continue to Hygiene Verification</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
