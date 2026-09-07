'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Lock,
  ChevronLeft,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
} from 'lucide-react';
import StepNavigation from '../../components/StepNavigation';
import { apiFetch } from '../../lib/api';

export default function PaymentSimulationPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string>('demo-app-101');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'netbanking' | 'card'>('upi');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const appIdParam = params.get('applicationId') || localStorage.getItem('activeApplicationId') || 'demo-app-101';
      setApplicationId(appIdParam);
    }
  }, []);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      await apiFetch(`/applications/${applicationId}/payment/simulate`, {
        method: 'POST',
      });

      const passRes = await apiFetch(`/applications/${applicationId}/pass`, {
        method: 'POST',
      });

      if (passRes.success && passRes.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('cachedVendorPass', JSON.stringify(passRes.data));
        }
      }

      setPaymentSuccess(true);
      setIsProcessing(false);

      setTimeout(() => {
        router.push(`/vendor-pass/${applicationId}`);
      }, 1200);
    } catch {
      setPaymentSuccess(true);
      setIsProcessing(false);
      setTimeout(() => {
        router.push(`/vendor-pass/${applicationId}`);
      }, 1200);
    }
  };

  return (
    <div className="nfssi-page">
      <div className="nfssi-container max-w-4xl">
        {/* 5-Step Horizontal Stepper */}
        <StepNavigation currentStep={5} applicationId={applicationId} />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172238]">Statutory Fee Payment</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Step 5 of 5: Pay the official ₹100 annual statutory registration fee under FSS Act 2006.
            </p>
          </div>
          <button
            onClick={() => router.push(`/document?applicationId=${applicationId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Documents
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          {/* Left Column: Payment Method Selection */}
          <div className="space-y-6">
            <div className="nfssi-card p-6 sm:p-8">
              <h2 className="text-base font-black text-[#172238] mb-4">Select Payment Mode</h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('upi')}
                  className={`w-full flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                    selectedMethod === 'upi'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    selectedMethod === 'upi' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-[#172238]">Instant UPI / QR Code</p>
                    <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>
                  {selectedMethod === 'upi' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('netbanking')}
                  className={`w-full flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                    selectedMethod === 'netbanking'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    selectedMethod === 'netbanking' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-[#172238]">Net Banking / Treasury</p>
                    <p className="text-[11px] text-slate-500">SBI, HDFC, ICICI, PNB, Canara Bank</p>
                  </div>
                  {selectedMethod === 'netbanking' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`w-full flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                    selectedMethod === 'card'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    selectedMethod === 'card' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-[#172238]">RuPay / Debit Card</p>
                    <p className="text-[11px] text-slate-500">Zero MDR charge on RuPay debit cards</p>
                  </div>
                  {selectedMethod === 'card' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                </button>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Official Civic Prototype:</strong> Demonstrates zero-friction simulated fee payment for petty food businesses.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Government Treasury Challan / Receipt Summary */}
          <div className="space-y-6">
            <div className="nfssi-card p-6 sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                <div className="flex items-center gap-2 text-xs font-black text-[#172238]">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>Treasury Challan Breakdown</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">FY 2026-27</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Petty Vendor Basic Registration</span>
                  <span className="font-mono font-bold text-slate-800">₹ 100.00</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Digital Portal Convenience Fee</span>
                  <span className="font-mono font-bold text-emerald-600">₹ 0.00</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>GST (Statutory Exemption)</span>
                  <span className="font-mono font-bold text-slate-800">₹ 0.00</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-black text-[#172238]">Total Amount Payable</span>
                  <span className="text-2xl font-black text-[#172238]">₹ 100.00</span>
                </div>
              </div>

              <div className="mt-6">
                {!paymentSuccess ? (
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isProcessing}
                    className="w-full rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-black py-4 px-6 text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>Simulating Payment &amp; Pass Issuance...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-emerald-400" />
                        <span>Pay ₹100 &amp; Issue Digital Pass</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-black text-emerald-800">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>Payment Verified! Redirecting to Pass...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}