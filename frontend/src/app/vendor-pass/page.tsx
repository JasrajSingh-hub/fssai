'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function VendorPassIndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeId = localStorage.getItem('activeApplicationId') || 'demo-app-101';
      router.replace(`/vendor-pass/${activeId}`);
    }
  }, [router]);

  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-3">
      <RefreshCw className="w-8 h-8 animate-spin text-[#F8C39B]" />
      <p className="text-xs font-bold text-[#F8C39B]">Loading Vendor Pass...</p>
    </div>
  );
}