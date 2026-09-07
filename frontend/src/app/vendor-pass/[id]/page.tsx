'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  ExternalLink,
  Download,
  Share2,
  ChevronLeft,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  MessageCircle,
  Zap,
  Printer,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  BadgeCheck,
  Star,
  Copy,
  Check,
  Bell,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';

export interface CommunityFeedbackItem {
  rating: number;
  tags?: string[];
  comment?: string;
  submittedAt: string | Date;
}

export interface VendorNotificationItem {
  title?: string;
  message?: string;
  rating?: number;
  tags?: string[];
  timestamp?: string | Date;
  read?: boolean;
}

interface VendorPassData {
  passId: string;
  syntheticReferenceId: string;
  businessType: string;
  businessName?: string;
  vendorName?: string;
  foodCategories: string[];
  issueDate?: string | Date;
  validUntil?: string | Date;
  renewalStatus?: 'CURRENT' | 'DUE_SOON' | 'EXPIRED' | 'RENEWED';
  prototypeStatus: string;
  isPrototype: boolean;
  disclaimer: string;
  premises?: {
    verificationType?: string;
    wardNumber?: string;
    tvcCertificateNumber?: string;
    landmark?: string;
    isVerified?: boolean;
  };
  communityTrust?: {
    averageRating: number;
    totalReviews: number;
    verifiedBadge?: boolean;
    feedbackHistory?: CommunityFeedbackItem[];
  };
  latestNotification?: VendorNotificationItem | null;
  qrPayload: {
    type: string;
    passId: string;
    applicationId: string;
    status: string;
  };
}

export default function VendorPassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = (params?.id as string) || 'demo-app-101';

  const [passData, setPassData] = useState<VendorPassData>({
    passId: 'VPR-2026-8F72K',
    syntheticReferenceId: 'SYN-FSSAI-7K92P',
    businessType: 'street_food_vendor',
    businessName: 'Ramesh Chai & Nashta Corner',
    vendorName: 'Ramesh Kumar',
    foodCategories: ['Tea & Hot Beverages', 'Prepared Street Snacks'],
    issueDate: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    renewalStatus: 'CURRENT',
    prototypeStatus: 'PROTOTYPE',
    isPrototype: true,
    disclaimer:
      'Official FSSAI Fast-Track Digital Credential — Schedule 4 Basic Registration',
    premises: {
      verificationType: 'TVC_CERTIFICATE',
      wardNumber: 'Ward 14 - Sector 18 Market',
      tvcCertificateNumber: 'DL-NDMC-TVC-2024-8841',
      landmark: 'Sector 18 North Vending Cluster',
      isVerified: true,
    },
    communityTrust: {
      averageRating: 4.8,
      totalReviews: 14,
      verifiedBadge: true,
      feedbackHistory: [],
    },
    latestNotification: null,
    qrPayload: {
      type: 'DEMO_VENDOR_PASS',
      passId: 'VPR-2026-8F72K',
      applicationId: applicationId,
      status: 'PROTOTYPE',
    },
  });

  const [passStatusState, setPassStatusState] = useState<'ACTIVE' | 'DUE_SOON' | 'SUSPENDED'>('ACTIVE');
  const [showDeficiencyToast, setShowDeficiencyToast] = useState(false);
  const [deficiencyActionUrl, setDeficiencyActionUrl] = useState<string | null>(null);
  const [isRaisingDeficiency, setIsRaisingDeficiency] = useState(false);
  const [showRenewalToast, setShowRenewalToast] = useState(false);
  const [renewalActionUrl, setRenewalActionUrl] = useState<string | null>(null);
  const [isSimulatingExpiry, setIsSimulatingExpiry] = useState(false);

  // Two-device IP discovery and real-time WhatsApp alert states
  const [systemIp, setSystemIp] = useState<string>('10.133.245.40');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeNotification, setActiveNotification] = useState<VendorNotificationItem | null>(null);
  const [lastNotificationTimestamp, setLastNotificationTimestamp] = useState<string | null>(null);
  const [showWhatsAppAlert, setShowWhatsAppAlert] = useState(false);

  useEffect(() => {
    const fetchPass = async () => {
      try {
        const res = await apiFetch(`/applications/${applicationId}/pass`);
        if (res.success && res.data) {
          setPassData((prev) => ({ ...prev, ...res.data }));
        } else {
          const cached = localStorage.getItem('cachedVendorPass');
          if (cached) {
            setPassData((prev) => ({ ...prev, ...JSON.parse(cached) }));
          }
        }
      } catch {
        const cached = localStorage.getItem('cachedVendorPass');
        if (cached) {
          try {
            setPassData((prev) => ({ ...prev, ...JSON.parse(cached) }));
          } catch {}
        }
      }

      // Check extracted profile for vendor name
      try {
        const prof = localStorage.getItem('vendorProfile');
        if (prof) {
          const parsed = JSON.parse(prof);
          if (parsed.vendorName) {
            setPassData((prev) => ({
              ...prev,
              vendorName: parsed.vendorName,
              businessName: parsed.stallName || prev.businessName,
            }));
          }
        }
      } catch {}
    };

    fetchPass();
  }, [applicationId]);

  // 1. Fetch system IP for two-device QR code generation
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const res = await apiFetch<{ localIp: string }>('/system-info');
        if (res.success && res.data?.localIp) {
          setSystemIp(res.data.localIp);
        }
      } catch {}
    };
    fetchSystemInfo();
  }, []);

  // 2. Play distinct two-tone WhatsApp style chime
  const playWhatsAppTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio chime skipped:', e);
    }
  };

  // 3. Poll for customer feedback notifications every 3.5 seconds
  useEffect(() => {
    const currentPassId = passData.passId || 'VPR-2026-8F72K';
    let isMounted = true;

    const poll = async () => {
      try {
        const res = await apiFetch<{
          communityTrust?: {
            averageRating: number;
            totalReviews: number;
            verifiedBadge?: boolean;
          };
          latestNotification?: VendorNotificationItem | null;
          pass?: {
            communityTrust?: {
              averageRating: number;
              totalReviews: number;
              verifiedBadge?: boolean;
            };
            latestNotification?: VendorNotificationItem | null;
          };
        }>(`/vendor-pass/${currentPassId}`);

        if (!isMounted) return;

        if (res.success && res.data) {
          const trustData = res.data.communityTrust || res.data.pass?.communityTrust;
          if (trustData) {
            setPassData((prev) => ({
              ...prev,
              communityTrust: {
                averageRating: trustData.averageRating ?? prev.communityTrust?.averageRating ?? 4.8,
                totalReviews: trustData.totalReviews ?? prev.communityTrust?.totalReviews ?? 14,
                verifiedBadge: trustData.verifiedBadge ?? prev.communityTrust?.verifiedBadge ?? true,
                feedbackHistory: prev.communityTrust?.feedbackHistory ?? [],
              },
            }));
          }

          const notif = res.data.latestNotification || res.data.pass?.latestNotification;
          if (notif && !notif.read) {
            const timeKey = notif.timestamp ? new Date(notif.timestamp).toISOString() : JSON.stringify(notif);
            if (timeKey !== lastNotificationTimestamp) {
              setActiveNotification(notif);
              setLastNotificationTimestamp(timeKey);
              setShowWhatsAppAlert(true);
              playWhatsAppTone();
              if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                try {
                  navigator.vibrate(200);
                } catch {}
              }
            }
          }
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [passData.passId, lastNotificationTimestamp]);

  const dismissWhatsAppAlert = async () => {
    setShowWhatsAppAlert(false);
    try {
      await apiFetch(`/vendor-pass/${passData.passId}/dismiss-notification`, {
        method: 'POST',
      });
    } catch {}

    const target = document.getElementById('community-trust-badge');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const raiseDeficiency = async () => {
    setIsRaisingDeficiency(true);
    setPassStatusState('SUSPENDED');
    const res = await apiFetch<{ remedyToken: string; actionUrl: string }>(
      `/applications/${applicationId}/deficiency`,
      {
        method: 'POST',
        body: JSON.stringify({ code: 'STALL_PHOTO_UNCLEAR' }),
      }
    );
    setIsRaisingDeficiency(false);
    if (res.success && res.data?.actionUrl) {
      setDeficiencyActionUrl(res.data.actionUrl);
      setShowDeficiencyToast(true);
    } else {
      setDeficiencyActionUrl(`/remedy/demo-remedy-token`);
      setShowDeficiencyToast(true);
    }
  };

  const simulateExpiry = async () => {
    setIsSimulatingExpiry(true);
    setPassStatusState('DUE_SOON');
    const res = await apiFetch<{ passId: string; renewalToken: string; actionUrl: string }>(
      `/vendor-pass/${passData.passId}/simulate-expiry`,
      { method: 'POST' }
    );
    setIsSimulatingExpiry(false);
    if (res.success && res.data?.actionUrl) {
      setRenewalActionUrl(res.data.actionUrl);
      setShowRenewalToast(true);
    } else {
      setRenewalActionUrl(`/remedy/demo-remedy-token`);
      setShowRenewalToast(true);
    }
  };

  const resetToActive = () => {
    setPassStatusState('ACTIVE');
    setShowDeficiencyToast(false);
    setShowRenewalToast(false);
  };

  const formatDate = (value?: string | Date) =>
    value
      ? new Date(value).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '06 Sep 2026';

  const origin =
    typeof window !== 'undefined'
      ? (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
          ? window.location.origin
          : (systemIp ? `http://${systemIp}:3000` : window.location.origin))
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://nfssi.vercel.app');

  // QR Code must open the public verification screen
  const qrTargetUrl = `${origin}/verify-pass/${passData.passId}`;
  const qrString = qrTargetUrl;

  const handleCopyQrUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(qrTargetUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="nfssi-page">
      {/* Animated Mobile-Styled WhatsApp Push Notification Banner */}
      {showWhatsAppAlert && activeNotification && (
        <aside
          role="alert"
          aria-live="assertive"
          onClick={dismissWhatsAppAlert}
          className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md cursor-pointer transition-all duration-500 transform animate-in slide-in-from-top-6"
        >
          <div className="overflow-hidden rounded-2xl border-2 border-[#25D366] bg-[#0b1c14] p-4 text-white shadow-2xl backdrop-blur-md transition hover:scale-[1.01] active:scale-[0.99]">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-[#0b1c14] shadow-md">
                <MessageCircle className="h-6 w-6 fill-current" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#25D366]">
                    WhatsApp • FSSAI Seva Kendra
                  </span>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>

                <p className="mt-1 text-xs font-bold leading-relaxed text-white">
                  {activeNotification.message || `Aapke thele ko customer ne ${activeNotification.rating || 5}-star rating di hai!`}
                </p>

                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-emerald-900/60 text-[11px]">
                  <span className="font-black text-[#25D366] hover:underline flex items-center gap-1">
                    Tap to view Social Trust badge →
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissWhatsAppAlert();
                    }}
                    className="rounded bg-white/10 px-2 py-0.5 font-bold text-slate-300 hover:bg-white/20"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* WhatsApp Alerts Simulation */}
      {showDeficiencyToast && (
        <button
          type="button"
          onClick={() => deficiencyActionUrl && router.push(deficiencyActionUrl)}
          className="fixed left-4 right-4 top-5 z-50 mx-auto max-w-md rounded-2xl border border-emerald-500 bg-[#0f2e1e] p-4 text-left shadow-2xl transition-transform active:scale-[0.99]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                WhatsApp • FSSAI Seva Kendra
              </p>
              <p className="mt-1 text-xs font-bold leading-snug text-white">
                Alert: Food Safety Officer ne kami darj ki hai. Kripya naya photo upload karein.
              </p>
              <p className="mt-1 text-xs font-black text-emerald-400 hover:underline">Tap to resolve in 1-Click →</p>
            </div>
          </div>
        </button>
      )}

      {showRenewalToast && (
        <button
          type="button"
          onClick={() => renewalActionUrl && router.push(renewalActionUrl)}
          className="fixed left-4 right-4 top-5 z-50 mx-auto max-w-md rounded-2xl border border-amber-500 bg-[#2d1e08] p-4 text-left shadow-2xl transition-transform active:scale-[0.99]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                WhatsApp • FSSAI Renewal Reminder
              </p>
              <p className="mt-1 text-xs font-bold leading-snug text-white">
                Alert: Aapka FSSAI Pass agle 15 din me expire ho raha hai. Late fee se bachne ke liye renew karein.
              </p>
              <p className="mt-1 text-xs font-black text-amber-400 hover:underline">Renew in 1-Tap (₹100) →</p>
            </div>
          </div>
        </button>
      )}

      <div className="nfssi-container">
        {/* Top Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Return to Home
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-[#172238] hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Pass</span>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'FSSAI Digital Vendor Pass',
                    url: window.location.href,
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-[#172238] hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* National Registry Verified Top Banner (Visily Screen 7) */}
        <div className="mb-8 rounded-2xl bg-[#172238] text-white p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-400">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                Government of India • FSSAI Food Safety Digital Credential
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                National Petty Food Business Registry
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {passStatusState === 'ACTIVE' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-4 py-1.5 text-xs font-black text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ACTIVE • VERIFIED
              </span>
            )}
            {passStatusState === 'DUE_SOON' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-4 py-1.5 text-xs font-black text-amber-300">
                <Clock className="h-4 w-4 text-amber-400" />
                RENEWAL DUE SOON
              </span>
            )}
            {passStatusState === 'SUSPENDED' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-400/40 px-4 py-1.5 text-xs font-black text-rose-300">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                DEFICIENCY PENDING
              </span>
            )}
          </div>
        </div>

        {/* Main 2-Column Section */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Left Column: Official Digital Vendor Pass Credential Card */}
          <div className="space-y-6">
            <div className="nfssi-card overflow-hidden border-2 border-slate-300 shadow-xl">
              {/* Pass Card Header */}
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Food Safety and Standards Authority of India
                  </p>
                  <p className="text-sm font-black text-[#172238]">Digital Vendor Pass (Schedule 4 Form A)</p>
                </div>
                <BadgeCheck className="h-6 w-6 text-emerald-600" />
              </div>

              {/* Pass Body */}
              <div className="p-6 sm:p-8">
                <div className="grid gap-6 sm:grid-cols-[160px_1fr] items-center">
                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-xs text-center">
                    <QRCodeSVG
                      value={qrTargetUrl}
                      size={130}
                      level="H"
                      includeMargin={false}
                    />
                    <p className="mt-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Scan to Verify
                    </p>
                    <div className="mt-2 w-full pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyQrUrl}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition active:scale-95"
                          title="Copy direct verification link for testing on mobile device"
                        >
                          {copiedUrl ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
                          <span>{copiedUrl ? 'Copied URL' : 'Copy URL'}</span>
                        </button>
                        <a
                          href={qrTargetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                          title="Open customer verification view in new tab"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Simulate</span>
                        </a>
                      </div>
                      <p className="mt-1.5 text-[9px] font-mono text-slate-400 truncate max-w-[155px]" title={qrString}>
                        {origin}
                      </p>
                    </div>
                  </div>

                  {/* Stall Credentials */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Registered Food Stall Name
                      </span>
                      <h2 className="text-xl font-black text-[#172238] leading-tight">
                        {passData.businessName || 'Ramesh Chai & Nashta Corner'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Operator Name</span>
                        <p className="font-bold text-slate-800">{passData.vendorName || 'Ramesh Kumar'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Registration Pass ID</span>
                        <p className="font-mono font-bold text-emerald-700">{passData.passId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Issue Date</span>
                        <p className="font-semibold text-slate-800">{formatDate(passData.issueDate)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Valid Until</span>
                        <p className="font-semibold text-slate-800">{formatDate(passData.validUntil)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Strip: Vending Zone & TVC Authorization */}
                <div className="mt-6 border-t border-slate-200 pt-5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>
                      <strong>Designated Spot:</strong> {passData.premises?.wardNumber || 'Ward 14 - Sector 18 Market'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Municipal TVC ID:</strong> {passData.premises?.tvcCertificateNumber || 'DL-NDMC-TVC-2024-8841'} (Authorized)
                    </span>
                  </div>
                </div>

                {/* Customer Verification Link */}
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <button
                    onClick={() => router.push(`/verify-pass/${passData.passId}`)}
                    className="w-full rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-bold py-3.5 px-4 text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Launch Public Customer Verification View</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Community Trust & Sandbox Switcher */}
          <div className="space-y-6">
            {/* Live Community Feedback & Trust Card */}
            <div id="community-trust-badge" className="nfssi-card p-6 border-2 border-emerald-500/30 bg-gradient-to-br from-white to-[#f0fdf4] shadow-md scroll-mt-24">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <h3 className="text-sm font-black text-[#172238]">Community Trust Rating</h3>
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 border border-emerald-200">
                  Live Sync (3.5s)
                </span>
              </div>

              <div className="flex items-center gap-4 my-4 p-4 rounded-xl bg-white border border-emerald-100 shadow-xs">
                <div className="text-4xl font-black text-[#172238]">
                  {(passData.communityTrust?.averageRating || 4.8).toFixed(1)}
                </div>
                <div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(passData.communityTrust?.averageRating || 4.8)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-bold">
                    Based on {passData.communityTrust?.totalReviews || 14} verified customer audits
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-100/60">
                <span className="text-slate-500">WhatsApp Alert Flow:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Real-Time Connected
                </span>
              </div>
            </div>

            {/* Compliance Overview Card */}
            <div className="nfssi-card p-6">
              <h3 className="text-sm font-black text-[#172238] mb-4">Compliance &amp; Trust Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <span className="text-slate-600">Schedule 4 Hygiene Score</span>
                  <span className="font-black text-emerald-600">94% (Verified)</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <span className="text-slate-600">Water Source Check</span>
                  <span className="font-bold text-slate-800">Potable Dispenser</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <span className="text-slate-600">Waste Management</span>
                  <span className="font-bold text-slate-800">Covered Lid Bin</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                  <span className="text-slate-600">Annual Statutory Fee</span>
                  <span className="font-bold text-emerald-600">₹100 Paid (FY 26-27)</span>
                </div>
              </div>
            </div>

            {/* Interactive Demo Sandbox Controls (Screen 7 evaluation) */}
            <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-[#172238] mb-1">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Evaluator Lifecycle Sandbox</span>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Test various regulatory lifecycles in real time:
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={resetToActive}
                  className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg border text-left transition-colors flex items-center justify-between ${
                    passStatusState === 'ACTIVE'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>1. Active Pass (Fully Compliant)</span>
                  {passStatusState === 'ACTIVE' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={simulateExpiry}
                  disabled={isSimulatingExpiry}
                  className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg border text-left transition-colors flex items-center justify-between ${
                    passStatusState === 'DUE_SOON'
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>2. Simulate 30-Day Expiry Notice</span>
                  <Clock className="h-4 w-4 text-amber-600" />
                </button>

                <button
                  type="button"
                  onClick={raiseDeficiency}
                  disabled={isRaisingDeficiency}
                  className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg border text-left transition-colors flex items-center justify-between ${
                    passStatusState === 'SUSPENDED'
                      ? 'border-rose-500 bg-rose-50 text-rose-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>3. Simulate FSO Deficiency Notice</span>
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
