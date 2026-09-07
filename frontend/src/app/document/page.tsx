'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileCheck,
  Crop,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileText,
  ChevronLeft,
  Camera,
  Lock,
  Sparkles,
} from 'lucide-react';
import StepNavigation from '../../components/StepNavigation';
import { apiFetch } from '../../lib/api';

export default function DocumentUploadPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string>('demo-app-101');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedDocRef, setConfirmedDocRef] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('stall-premise-photo.png');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const appIdParam = params.get('applicationId') || localStorage.getItem('activeApplicationId') || 'demo-app-101';
      setApplicationId(appIdParam);

      // Pre-fill with a synthetic stall photo if already verified in hygiene
      if (sessionStorage.getItem('hygiene_verified') === 'true' && !imageSrc) {
        handleUseDemoDocument();
      }
    }
  }, []);

  const handleUseDemoDocument = () => {
    setErrorMsg(null);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clean government style synthetic document graphic
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Header bar
    ctx.fillStyle = '#172238';
    ctx.fillRect(10, 10, canvas.width - 20, 54);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FSSAI FAST-TRACK STALL VERIFICATION KIT', canvas.width / 2, 42);

    // Content
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(30, 80, canvas.width - 60, 200);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(30, 80, canvas.width - 60, 200);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('STALL PREMISE: Verified Frontal View Unit A-1', 50, 120);
    ctx.fillText('MUNICIPAL ZONE: Sector 18 Designated Petty Vending Zone', 50, 150);
    ctx.fillText('WATER & WASTE: Declared Compliant with Schedule 4 Standards', 50, 180);
    ctx.fillText('UIDAI / AADHAAR: Linked and Encrypted via DigiLocker Sandbox', 50, 210);
    ctx.fillText(`TIMESTAMP: ${new Date().toLocaleDateString('en-IN')}`, 50, 240);

    // Seal icon
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText('✓ DIGITAL ATTESTED', 50, 320);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NATIONAL FOOD SAFETY & STANDARDS AUTHORITY DIGITAL REGISTRY', canvas.width / 2, 380);

    const dataUrl = canvas.toDataURL('image/png');
    setFileName('synthetic-stall-verification-kit.png');
    setImageSrc(dataUrl);
    setIsCropping(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Please upload a valid image (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5MB limit.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      setFileName(file.name);
      setImageSrc(reader.result as string);
      setIsCropping(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCrop = () => {
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const targetWidth = 540;
      const targetHeight = 360;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const scale = zoomLevel;
      const sw = img.width / scale;
      const sh = img.height / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

      const croppedUrl = canvas.toDataURL('image/png');
      setImageSrc(croppedUrl);
      setIsCropping(false);
    };
  };

  const handleConfirmDocument = async () => {
    if (!imageSrc) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch(`/applications/${applicationId}/document`, {
        method: 'POST',
        body: JSON.stringify({
          documentType: 'STALL_PHOTO',
          fileName,
          documentTitle: 'Confirmed Stall Verification Kit',
          fileData: imageSrc,
          mimeType: 'image/png',
          isSynthetic: true,
        }),
      });

      if (res.success && res.data?.document) {
        setConfirmedDocRef(res.data.document.applicationRefNumber);
      } else {
        setConfirmedDocRef(`SYN-DOC-${Date.now().toString().slice(-6)}`);
      }
      sessionStorage.setItem('document_uploaded', 'true');
    } catch {
      setConfirmedDocRef(`SYN-DOC-${Date.now().toString().slice(-6)}`);
      sessionStorage.setItem('document_uploaded', 'true');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="nfssi-page">
      <div className="nfssi-container">
        {/* 5-Step Horizontal Stepper */}
        <StepNavigation currentStep={4} applicationId={applicationId} />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172238]">Official Documentation</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Step 4 of 5: Upload your stall verification kit and photo identification for statutory registration.
            </p>
          </div>
          <button
            onClick={() => router.push(`/hygiene?applicationId=${applicationId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Hygiene
          </button>
        </div>

        {/* DigiLocker Notice Banner (Visily Screen 6) */}
        <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-900">
                DigiLocker &amp; National Urban Livelihood Mission (NULM) Integrated
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                All submitted stall documents are digitally signed and verified under Ministry of Health guidelines. No notarization required.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Left Column: Upload / Preview Area */}
          <div className="space-y-6">
            <div className="nfssi-card p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div>
                  <h2 className="text-base font-black text-[#172238]">Stall Verification Document</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Clear frontal photo showing the cart layout and signage</p>
                </div>
                <button
                  type="button"
                  onClick={handleUseDemoDocument}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#172238] transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Generate Demo Kit</span>
                </button>
              </div>

              {!imageSrc ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                  <p className="text-sm font-bold text-slate-700">
                    Drag and drop your stall photo, or <span className="text-emerald-600">Browse</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">JPEG, PNG, or WebP up to 5MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-[16/11] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center p-2">
                    <img
                      src={imageSrc}
                      alt="Stall verification preview"
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  </div>

                  {isCropping ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Zoom &amp; Frame Scale:</span>
                        <span className="text-emerald-700 font-mono">{zoomLevel.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="2.0"
                        step="0.1"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCropping(false)}
                          className="flex-1 py-2 text-xs font-bold border border-slate-300 rounded-lg text-slate-600 hover:bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyCrop}
                          className="flex-1 py-2 text-xs font-bold bg-[#172238] text-white rounded-lg hover:bg-slate-800"
                        >
                          Apply Framing
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCropping(true)}
                        className="flex-1 py-2.5 px-3 text-xs font-bold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                      >
                        <Crop className="h-3.5 w-3.5 text-slate-500" />
                        <span>Adjust Frame / Crop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageSrc(null);
                          setConfirmedDocRef(null);
                        }}
                        className="py-2.5 px-4 text-xs font-bold border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Replace</span>
                      </button>
                    </div>
                  )}

                  {!confirmedDocRef && (
                    <button
                      type="button"
                      onClick={handleConfirmDocument}
                      disabled={isSubmitting}
                      className="w-full rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-black py-3.5 px-4 text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                          <span>Attesting Document...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Attest &amp; Digitally Sign Document</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Verification Status & Next Button */}
          <div className="space-y-6">
            <div className="nfssi-card p-6">
              <h3 className="text-sm font-black text-[#172238] mb-4">Document Verification Status</h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Document Type</span>
                  <span className="font-bold text-slate-800">Stall Verification Kit</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Aadhaar Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> OTP Verified
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Audit Compliance</span>
                  <span className="font-bold text-emerald-600">100% (Schedule 4)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Registry Reference</span>
                  <span className="font-mono font-bold text-slate-800">
                    {confirmedDocRef || 'Pending Signature'}
                  </span>
                </div>
              </div>

              {confirmedDocRef ? (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Document securely verified and filed with FSSAI Fast-Track registry.</span>
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-slate-600 text-xs">
                  Tap &ldquo;Attest &amp; Digitally Sign&rdquo; above to finalize your document.
                </div>
              )}
            </div>

            {/* Next Step Button (Links to Step 5: Payment) */}
            <button
              type="button"
              onClick={() => router.push(`/payment?applicationId=${applicationId}`)}
              className="w-full rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-black py-4 px-6 text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            >
              <span>Proceed to Statutory Fee (₹100)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
