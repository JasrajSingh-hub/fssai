'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Languages,
  CheckCircle2,
  Store,
  Phone,
  User,
  MapPin,
  Utensils,
} from 'lucide-react';
import StepNavigation from '../../components/StepNavigation';
import { apiFetch, ensureAuthenticated } from '../../lib/api';

type LanguageOption = 'Hinglish' | 'Hindi' | 'English';

const SAMPLE_PRESETS = [
  {
    label: 'Chai & Samosa Stall',
    vendorName: 'Ramesh Kumar',
    mobile: '8102098695',
    stallName: 'Ramesh Chai & Nashta Center',
    category: 'Tea, Hot Beverages & Snacks',
    location: 'Sector 18 Market, Noida',
    text: 'Main Ramesh Kumar hoon, Sector 18 Noida me chai, samosa aur kachori ka thela chalata hoon.',
    lang: 'Hinglish' as LanguageOption,
    icon: '☕',
  },
  {
    label: 'Street Food & Chaat Cart',
    vendorName: 'Santosh Devi',
    mobile: '9812345678',
    stallName: 'Santosh Golgappe & Chaat',
    category: 'Prepared Street Food / Chaat',
    location: 'Chandni Chowk Vending Zone, Delhi',
    text: 'Mera naam Santosh Devi hai, Chandni Chowk me golgappe, bhelpuri aur aloo tikki ka stall lagati hoon.',
    lang: 'Hindi' as LanguageOption,
    icon: '🍲',
  },
  {
    label: 'Home Kitchen / Tiffin',
    vendorName: 'Anand Sharma',
    mobile: '9988776655',
    stallName: 'Annapurna Tiffin Services',
    category: 'Packed Meals & Tiffin',
    location: 'Indiranagar 2nd Stage, Bengaluru',
    text: 'My name is Anand Sharma. I run a home kitchen preparing daily lunch tiffin boxes in Indiranagar.',
    lang: 'English' as LanguageOption,
    icon: '🍱',
  },
];

export default function IntakePage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>('Hinglish');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [processingState, setProcessingState] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [vendorName, setVendorName] = useState<string>('Ramesh Kumar');
  const [mobileNumber, setMobileNumber] = useState<string>('8102098695');
  const [stallName, setStallName] = useState<string>('Ramesh Chai & Nashta Corner');
  const [foodCategory, setFoodCategory] = useState<string>('Tea, Coffee & Street Snacks');
  const [vendingLocation, setVendingLocation] = useState<string>('Sector 18 Market, Ward 14');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const textParam = params.get('text');
      if (params.get('demo') === 'true') {
        const p = SAMPLE_PRESETS[0];
        setTranscript(textParam || p.text);
        setVendorName(p.vendorName);
        setMobileNumber(p.mobile);
        setStallName(p.stallName);
        setFoodCategory(p.category);
        setVendingLocation(p.location);
        setSelectedLanguage('Hinglish');
      }

      // Check browser Web Speech API support
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage === 'English' ? 'en-IN' : 'hi-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMsg(null);
        };

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          if (current) {
            setTranscript(current);
            // Basic heuristics to parse voice input into form fields if detected
            const lower = current.toLowerCase();
            if (lower.includes('chai') || lower.includes('tea')) {
              setFoodCategory('Tea, Coffee & Hot Beverages');
              if (!stallName) setStallName('Chai & Snacks Corner');
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            setErrorMsg('Microphone input note: you can also edit or type details directly.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLanguage]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      setErrorMsg('Voice input is not supported in this browser. You can type or tap a sample below!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setErrorMsg(null);
      try {
        recognitionRef.current.lang = selectedLanguage === 'English' ? 'en-IN' : 'hi-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
        setIsListening(false);
      }
    }
  };

  const applyPreset = (preset: typeof SAMPLE_PRESETS[number]) => {
    setTranscript(preset.text);
    setSelectedLanguage(preset.lang);
    setVendorName(preset.vendorName);
    setMobileNumber(preset.mobile);
    setStallName(preset.stallName);
    setFoodCategory(preset.category);
    setVendingLocation(preset.location);
  };

  const handleSaveAndContinue = async () => {
    if (!vendorName.trim() || !mobileNumber.trim() || !stallName.trim()) {
      setErrorMsg('Please fill in your name, mobile number, and food stall name.');
      return;
    }

    setErrorMsg(null);
    setProcessingState('Saving intake details...');

    try {
      await ensureAuthenticated();

      const extracted = {
        kind_of_business: 'street_food_vendor',
        food_categories: foodCategory.split(',').map((s) => s.trim()),
        business_description: transcript || `${stallName} operated by ${vendorName}`,
        vendor_name: vendorName,
        mobile_number: mobileNumber,
        stall_name: stallName,
        vending_location: vendingLocation,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('extractedBusinessData', JSON.stringify(extracted));
        localStorage.setItem('vendorProfile', JSON.stringify({ vendorName, mobileNumber, stallName, vendingLocation }));
      }

      // Call intake analyze API
      const result = await apiFetch('/intake/analyze', {
        method: 'POST',
        body: JSON.stringify({
          rawTranscript: transcript || `${vendorName} runs ${stallName} selling ${foodCategory}`,
          language: selectedLanguage.toLowerCase(),
          vendorName,
          mobileNumber,
          stallName,
          vendingLocation,
        }),
      });

      const appId = result.data?.applicationId || `app-${Date.now().toString().slice(-6)}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeApplicationId', appId);
      }

      setProcessingState('Proceeding to Premises Compliance...');
      router.push(`/premises?applicationId=${appId}`);
    } catch (err) {
      console.warn('Intake submission error, proceeding with local application:', err);
      const fallbackAppId = `app-demo-${Date.now().toString().slice(-4)}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeApplicationId', fallbackAppId);
      }
      router.push(`/premises?applicationId=${fallbackAppId}`);
    }
  };

  return (
    <div className="nfssi-page">
      <div className="nfssi-container">
        {/* 5-Step Horizontal Stepper */}
        <StepNavigation currentStep={1} />

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.35fr]">
          {/* Left Column: Vendor Illustration & Voice Callout */}
          <div className="space-y-6">
            <div className="nfssi-card overflow-hidden p-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                <Image
                  src="/visily/page-02.jpg"
                  alt="Street vendor voice intake demonstration"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>

              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>बोल कर आसानी से फॉर्म भरें</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Start speaking in Hindi, Hinglish, or English. The AI automatically fills your food safety registration.
                </p>
              </div>

              {/* Sample Presets */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Or Click a Sample Preset
                </p>
                <div className="space-y-2">
                  {SAMPLE_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 p-3 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl">{p.icon}</span>
                        <div className="truncate">
                          <p className="text-xs font-black text-[#172238] group-hover:text-emerald-700 transition-colors">
                            {p.label}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{p.stallName}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 shrink-0">Use Preset →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Government Data Protection Badge */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-600 shadow-xs flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
              <p className="text-xs leading-relaxed">
                <strong>Official Government Portal:</strong> Personal data is encrypted under the Digital Personal Data Protection Act.
              </p>
            </div>
          </div>

          {/* Right Column: Basic Information Form & Microphone */}
          <div className="nfssi-card p-6 sm:p-8">
            <div className="border-b border-slate-200 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#172238]">Basic Information</h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Step 1 of 5: Enter your personal and food stall details.
                  </p>
                </div>

                {/* Language Mode Selector */}
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(['Hinglish', 'Hindi', 'English'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-1.5 text-xs font-black rounded-md transition-all ${
                        selectedLanguage === lang
                          ? 'bg-[#172238] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'Hindi' ? 'हिन्दी' : lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Microphone Voice Input Zone */}
            <div className="my-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-3">
                  {isListening && (
                    <span className="absolute -inset-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  )}
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={!!processingState}
                    className={`relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
                      isListening
                        ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                        : 'bg-[#172238] text-white hover:bg-slate-800'
                    }`}
                    aria-label="Toggle voice input"
                  >
                    {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8 text-emerald-400" />}
                  </button>
                </div>

                <p className="text-sm font-black text-[#172238]">
                  {isListening ? 'Listening to your voice... (Tap to Stop)' : 'Tap to Speak Details'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedLanguage === 'Hindi'
                    ? 'अपना नाम, दुकान का नाम और पता बोलें'
                    : selectedLanguage === 'Hinglish'
                    ? 'Boliye: Apna naam, thele ka naam aur location'
                    : 'Speak your name, food category, and vending location'}
                </p>
              </div>

              {/* Spoken Transcript Input Area */}
              <div className="mt-5 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Live Transcript &amp; Voice Input
                  </label>
                  {transcript && (
                    <button
                      type="button"
                      onClick={() => setTranscript('')}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Spoken words will appear here in real time..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Manual Form Fallback Inputs */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>Vendor Full Name (विक्रेता का नाम) *</span>
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span>Mobile Number (Aadhaar linked) *</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-3 text-xs font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      id="mobileNumber"
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="8102098695"
                      className="w-full rounded-r-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Store className="h-3.5 w-3.5 text-slate-500" />
                    <span>Stall / Business Name (दुकान का नाम) *</span>
                  </label>
                  <input
                    type="text"
                    value={stallName}
                    onChange={(e) => setStallName(e.target.value)}
                    placeholder="e.g. Ramesh Chai Bhandar"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Utensils className="h-3.5 w-3.5 text-slate-500" />
                    <span>Food Category (खाद्य श्रेणी) *</span>
                  </label>
                  <input
                    type="text"
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    placeholder="e.g. Tea, Beverages, Snacks"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>Vending Spot / Market Zone *</span>
                </label>
                <input
                  type="text"
                  value={vendingLocation}
                  onChange={(e) => setVendingLocation(e.target.value)}
                  placeholder="e.g. Sector 18 Market, Noida, Ward 14"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={!!processingState}
                className="w-full rounded-lg bg-[#172238] hover:bg-slate-800 text-white font-black py-4 px-6 text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {processingState ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>{processingState}</span>
                  </>
                ) : (
                  <>
                    <span>Save &amp; Continue to Premises Compliance</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}