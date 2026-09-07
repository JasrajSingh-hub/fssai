'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface RenewalPass {
  passNumber: string;
  applicationId: string;
  businessName?: string;
  businessType?: string;
  validUntil: string | Date;
  renewalStatus: 'CURRENT' | 'DUE_SOON' | 'EXPIRED' | 'RENEWED';
  premises?: {
    verificationType?: string;
    wardNumber?: string;
    tvcCertificateNumber?: string;
    isVerified?: boolean;
  };
}

export default function RenewPassPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || '';
  const [pass, setPass] = useState<RenewalPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'renewing' | 'renewed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [renewedUntil, setRenewedUntil] = useState<string | null>(null);

  const apiUrl = getApiBaseUrl();
  const formatDate = (value?: string | Date) =>
    value
      ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Unavailable';

  useEffect(() => {
    const loadRenewal = async () => {
      try {
        const response = await fetch(`${apiUrl}/vendor-pass/renew/${token}`, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Invalid or expired renewal link');
        setPass(json.pass);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load renewal details');
      } finally {
        setLoading(false);
      }
    };

    if (token) void loadRenewal();
  }, [apiUrl, token]);

  const renew = async () => {
    setStatus('renewing');
    setError(null);
    try {
      const [response] = await Promise.all([
        fetch(`${apiUrl}/vendor-pass/renew/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 1000)),
      ]);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to renew pass');
      setRenewedUntil(json.validUntil);
      setStatus('renewed');
    } catch (renewalError) {
      setStatus('idle');
      setError(renewalError instanceof Error ? renewalError.message : 'Unable to renew pass');
    }
  };

  return (
    <div className="flex w-full flex-col space-y-4 pb-8">
      <div className="rounded-[30px] bg-[#F8C39B] p-6 text-[#201B3B] shadow-xl">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#6B5542]">
          <ShieldCheck className="h-4 w-4" /> Zero-login annual renewal
        </div>
        <h1 className="mt-4 text-2xl font-black">Renew Vendor Pass</h1>
        <p className="mt-1 text-xs font-semibold text-[#5B4838]">Annual statutory validity renewal</p>
      </div>

      {loading && <div className="rounded-2xl bg-[#2D2750] p-5 text-center text-xs text-[#F8C39B]">Loading pass renewal record...</div>}
      {error && <div className="rounded-2xl border border-[#F67B92]/40 bg-[#3D2036] p-4 text-xs text-[#FCE2CD]">{error}</div>}

      {pass && status !== 'renewed' && (
        <div className="space-y-4 rounded-[26px] border border-[#3E3668] bg-[#2D2750] p-5 text-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9E97C2]">Business</p>
            <p className="mt-1 text-lg font-black">{pass.businessName || (pass.businessType || 'Street Food Vendor').replace(/_/g, ' ')}</p>
            <p className="text-xs font-mono text-[#F8C39B]">Pass ID: {pass.passNumber}</p>
          </div>
          <div className="rounded-2xl bg-[#231E40] p-4 text-xs font-bold">
            <div className="flex justify-between"><span className="text-[#9E97C2]">Current expiry</span><span>{formatDate(pass.validUntil)}</span></div>
            <div className="mt-3 flex justify-between"><span className="text-[#9E97C2]">TVC premises</span><span className="text-right text-[#B9F2CA]">{pass.premises?.wardNumber ? `Ward ${pass.premises.wardNumber}` : 'Ward 14'} - TVC Certificate Active</span></div>
            <div className="mt-3 flex justify-between"><span className="text-[#9E97C2]">Renewal fee</span><span className="text-[#F8C39B]">INR 100 (Official FSSAI Annual Fee, Zero Middleman Markup)</span></div>
          </div>
          <button
            type="button"
            onClick={renew}
            disabled={status === 'renewing'}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F8C39B] px-4 py-4 text-xs font-black text-[#201B3B] disabled:opacity-60"
          >
            {status === 'renewing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {status === 'renewing' ? 'Confirming renewal...' : '1-Tap Re-verify & Renew for 1 Year'}
          </button>
        </div>
      )}

      {status === 'renewed' && (
        <div className="rounded-[26px] border border-[#91E7B2]/50 bg-[#1F3A2A] p-6 text-center text-[#B9F2CA]">
          <CheckCircle2 className="mx-auto h-14 w-14" />
          <h2 className="mt-4 text-xl font-black">Pass Renewed until {formatDate(renewedUntil || undefined)}</h2>
          <p className="mt-2 text-xs font-semibold">Your pass validity has been updated in the registry.</p>
          <button
            type="button"
            onClick={() => pass && router.push(`/vendor-pass/${pass.applicationId}`)}
            className="mt-5 w-full rounded-2xl bg-[#F8C39B] px-4 py-3 text-xs font-black text-[#201B3B]"
          >
            Return to Updated Pass
          </button>
        </div>
      )}
    </div>
  );
}
