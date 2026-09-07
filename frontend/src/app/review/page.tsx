'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Edit3,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  FileText,
  RefreshCw,
  ChevronLeft,
  Store,
  Receipt,
  Utensils,
} from 'lucide-react';
import StepNavigation from '../../components/StepNavigation';
import { apiFetch } from '../../lib/api';

interface BusinessData {
  kind_of_business: string;
  food_categories: string[];
  business_description?: string;
  language?: string;
  missing_information?: string[];
}

interface EligibilityData {
  path: string;
  fee: number;
  currency: string;
  isPrototype: boolean;
  message?: string;
}

interface PremisesData {
  verificationType?: string;
  wardNumber?: string;
  tvcCertificateNumber?: string;
  landmark?: string;
  isVerified?: boolean;
}

const BUSINESS_TYPE_OPTIONS = [
  { value: 'tea_stall', label: 'Tea Stall / Chai Point', icon: '☕' },
  { value: 'street_food_vendor', label: 'Street Food Vendor (Thela/Cart)', icon: '🍲' },
  { value: 'hawker', label: 'Mobile Hawker / Peddler', icon: '🛒' },
  { value: 'home_kitchen', label: 'Home Kitchen / Tiffin', icon: '🍱' },
  { value: 'petty_food_retailer', label: 'Petty Food Retailer', icon: '🏪' },
  { value: 'unknown', label: 'Other Food Vendor', icon: '🍽️' },
];

const DEFAULT_BUSINESS: BusinessData = {
  kind_of_business: 'street_food_vendor',
  food_categories: ['Prepared Street Food', 'Tea & Snacks'],
  business_description: 'Chai and street food stall in municipal vending zone',
  language: 'Hinglish',
  missing_information: [
    'Designated municipal vending zone / street address',
    'Water source declaration (Potable / Municipal tap)',
  ],
};

export default function BusinessReviewPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string>('demo-app-101');
  const [business, setBusiness] = useState<BusinessData>(DEFAULT_BUSINESS);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editBusinessType, setEditBusinessType] = useState<string>(DEFAULT_BUSINESS.kind_of_business);
  const [editCategories, setEditCategories] = useState<string>(DEFAULT_BUSINESS.food_categories.join(', '));
  const [editDescription, setEditDescription] = useState<string>(DEFAULT_BUSINESS.business_description || '');
  const [premises, setPremises] = useState<PremisesData | null>(null);

  const [step, setStep] = useState<'review' | 'submitting' | 'eligibility'>('review');
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const initReview = async () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const appIdParam = params.get('applicationId') || localStorage.getItem('activeApplicationId') || 'demo-app-101';
        setApplicationId(appIdParam);

        const cachedBusiness =
          localStorage.getItem('extractedBusinessData') || localStorage.getItem('extractedBusiness');
        if (cachedBusiness) {
          try {
            const parsed = JSON.parse(cachedBusiness);
            if (parsed.kind_of_business || parsed.food_categories) {
              setBusiness(parsed);
              setEditBusinessType(parsed.kind_of_business || 'street_food_vendor');
              setEditCategories(parsed.food_categories?.join(', ') || '');
              setEditDescription(parsed.business_description || '');
            }
          } catch {}
        }
      }
    };

    void initReview();
  }, []);

  const handleSaveEdit = () => {
    const splitCats = editCategories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    setBusiness({
      ...business,
      kind_of_business: editBusinessType,
      food_categories: splitCats.length > 0 ? splitCats : ['Prepared Food Items'],
      business_description: editDescription,
    });
    setIsEditing(false);
  };

  const handleConfirmAndContinue = async () => {
    setStep('submitting');
    setErrorMsg(null);

    try {
      await apiFetch(`/applications/${applicationId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          kind_of_business: business.kind_of_business,
          food_categories: business.food_categories,
          business_description: business.business_description,
        }),
      });

      const eligRes = await apiFetch(`/applications/${applicationId}/check-eligibility`, {
        method: 'POST',
      });

      if (eligRes.success && eligRes.data?.eligibility) {
        setEligibility(eligRes.data.eligibility);
      } else {
        setEligibility({
          path: 'basic_registration',
          fee: 100,
          currency: 'INR',
          isPrototype: true,
          message: 'Basic Registration pathway (Petty Food Business)',
        });
      }

      setStep('eligibility');
    } catch {
      setEligibility({
        path: 'basic_registration',
        fee: 100,
        currency: 'INR',
        isPrototype: true,
        message: 'Basic Registration pathway (Petty Food Business)',
      });
      setStep('eligibility');
    }
  };

  const currentOption =
    BUSINESS_TYPE_OPTIONS.find((b) => b.value === business.kind_of_business) || BUSINESS_TYPE_OPTIONS[1];

  return (
    <div className="nfssi-page">
      <div className="nfssi-container max-w-3xl">
        <StepNavigation currentStep={1} applicationId={applicationId} />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172238]">Profile Review &amp; Rules Check</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Confirm your classified stall details and statutory registration pathway.
            </p>
          </div>
          <button
            onClick={() => router.push(`/intake?applicationId=${applicationId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Intake
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step !== 'eligibility' ? (
          <div className="space-y-6">
            <div className="nfssi-card p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                    {currentOption.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#172238]">{currentOption.label}</h2>
                    <p className="text-xs text-emerald-700 font-bold">✓ AI Voice Classified</p>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-[#172238] hover:bg-slate-50 shadow-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Identified Food Categories
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {business.food_categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {business.business_description && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Spoken Business Description
                      </span>
                      <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs italic text-slate-700 leading-relaxed">
                        &ldquo;{business.business_description}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={handleConfirmAndContinue}
                      disabled={step === 'submitting'}
                      className="w-full rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-black py-4 px-6 text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-60"
                    >
                      {step === 'submitting' ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                          <span>Evaluating Eligibility Engine...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Profile &amp; Check Rules</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Kind</label>
                    <select
                      value={editBusinessType}
                      onChange={(e) => setEditBusinessType(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                    >
                      {BUSINESS_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Food Items (comma-separated)</label>
                    <input
                      type="text"
                      value={editCategories}
                      onChange={(e) => setEditCategories(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                      placeholder="e.g. Chai, Samosa, Snacks"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                    <textarea
                      rows={2}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 rounded-lg border border-slate-300 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="flex-1 rounded-lg bg-emerald-600 text-white py-2.5 text-xs font-black hover:bg-emerald-500 shadow-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Eligibility Pathway Card */
          <div className="nfssi-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Statutory Evaluation
                </span>
                <h2 className="text-2xl font-black text-[#172238] mt-0.5">Basic Registration</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800">
                ₹100 / Year
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Turnover Tier</span>
                <span className="text-slate-800">Petty FBO (&le; ₹12 Lakhs / year)</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Applicable Form</span>
                <span className="text-slate-800">Schedule 4 Form A</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Business Category</span>
                <span className="capitalize text-slate-800">{business.kind_of_business.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/premises?applicationId=${applicationId}`)}
              className="w-full rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-black py-4 px-6 text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            >
              <span>Next: Verify Premises Location</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
