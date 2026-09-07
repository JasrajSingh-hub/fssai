'use client';

import React from 'react';
import Link from 'next/link';
import { Check, User, MapPin, ShieldCheck, FileText, CreditCard } from 'lucide-react';

export interface StepNavigationProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  applicationId?: string;
}

const STEPS = [
  {
    step: 1,
    title: 'Basic Information',
    shortTitle: 'Intake',
    icon: User,
    href: (appId?: string) => (appId ? `/intake?applicationId=${appId}` : '/intake'),
  },
  {
    step: 2,
    title: 'Premises Compliance',
    shortTitle: 'Premises',
    icon: MapPin,
    href: (appId?: string) => (appId ? `/premises?applicationId=${appId}` : '/premises'),
  },
  {
    step: 3,
    title: 'Hygiene Verification',
    shortTitle: 'Hygiene',
    icon: ShieldCheck,
    href: (appId?: string) => (appId ? `/hygiene?applicationId=${appId}` : '/hygiene'),
  },
  {
    step: 4,
    title: 'Documentation',
    shortTitle: 'Documents',
    icon: FileText,
    href: (appId?: string) => (appId ? `/document?applicationId=${appId}` : '/document'),
  },
  {
    step: 5,
    title: 'Payment Simulation',
    shortTitle: 'Payment',
    icon: CreditCard,
    href: (appId?: string) => (appId ? `/payment?applicationId=${appId}` : '/payment'),
  },
];

export default function StepNavigation({ currentStep, applicationId }: StepNavigationProps) {
  return (
    <nav aria-label="Registration Progress" className="w-full mb-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-4 py-1">
          {STEPS.map((s, index) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;
            const isUpcoming = s.step > currentStep;
            const IconComponent = s.icon;

            const stepContent = (
              <div className="flex items-center gap-3 shrink-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[#172238] text-white ring-4 ring-slate-100 shadow-sm'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5 stroke-[3]" /> : <span>0{s.step}</span>}
                </div>
                <div className="hidden md:block text-left">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isCompleted
                        ? 'text-emerald-700'
                        : isCurrent
                        ? 'text-[#172238]'
                        : 'text-slate-400'
                    }`}
                  >
                    Step 0{s.step}
                  </p>
                  <p
                    className={`text-xs font-bold leading-snug whitespace-nowrap ${
                      isCurrent
                        ? 'text-slate-900 font-extrabold'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </p>
                </div>
                {/* Mobile label */}
                <div className="block md:hidden text-left">
                  <p
                    className={`text-[11px] font-bold whitespace-nowrap ${
                      isCurrent ? 'text-slate-900 font-black' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {s.shortTitle}
                  </p>
                </div>
              </div>
            );

            return (
              <React.Fragment key={s.step}>
                {isCompleted ? (
                  <Link
                    href={s.href(applicationId)}
                    className="group hover:opacity-90 transition-opacity"
                  >
                    {stepContent}
                  </Link>
                ) : (
                  <div>{stepContent}</div>
                )}

                {index < STEPS.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 min-w-[16px] sm:min-w-[32px] rounded-full transition-colors ${
                      s.step < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
