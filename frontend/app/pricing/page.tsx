"use client";

import Link from 'next/link';
import { CheckCircleIcon, SparklesIcon, RocketIcon } from '../components/Icons';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-100 py-20 px-6">
      
      <div className="max-w-6xl mx-auto text-center space-y-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full text-xs text-zinc-300 font-medium mb-4">
          <SparklesIcon className="w-3.5 h-3.5" />
          Upgrade to unlock the full Creator OS
        </div>
        <h1 className="text-5xl font-black text-[var(--foreground)] tracking-tight">Simple, transparent pricing</h1>
        <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">Stop paying for 5 different subscriptions. Get your entire content engine in one unified operating system.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 relative z-10">
        
        {/* Starter Plan */}
        <div className="surface-panel p-8 flex flex-col hover:border-zinc-700 transition-all shadow-2xl">
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Starter</h3>
          <p className="text-[var(--muted)] text-sm mb-6">Perfect for trying out the platform.</p>
          <div className="mb-8">
            <span className="text-4xl font-black text-[var(--foreground)]">$0</span>
            <span className="text-[var(--muted)]">/mo</span>
          </div>
          <button className="w-full py-3 rounded-xl bg-[var(--panel)] hover:bg-zinc-800 text-[var(--foreground)] font-bold transition-colors mb-8 border border-[var(--border)]">
            Current Plan
          </button>
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircleIcon className="w-4 h-4 text-[var(--muted)]" /> 3 AI Scripts per month</div>
            <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircleIcon className="w-4 h-4 text-[var(--muted)]" /> Basic Teleprompter</div>
            <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircleIcon className="w-4 h-4 text-[var(--muted)]" /> Standard Video Render</div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-[var(--background)] border-2 border-white rounded-3xl p-8 flex flex-col transform md:-translate-y-4 shadow-2xl shadow-white/5 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</div>
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Pro Creator</h3>
          <p className="text-[var(--muted)] text-sm mb-6">Everything you need to go viral daily.</p>
          <div className="mb-8">
            <span className="text-4xl font-black text-[var(--foreground)]">$29</span>
            <span className="text-[var(--muted)]">/mo</span>
          </div>
          <button className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold shadow-lg shadow-white/10 transition-all mb-8 flex justify-center items-center gap-2">
            <RocketIcon className="w-4 h-4" /> Upgrade to Pro
          </button>
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3 text-sm text-[var(--foreground)] font-medium"><CheckCircleIcon className="w-4 h-4 text-[var(--foreground)]" /> Unlimited AI Scripts</div>
            <div className="flex items-center gap-3 text-sm text-[var(--foreground)] font-medium"><CheckCircleIcon className="w-4 h-4 text-[var(--foreground)]" /> Omni-Channel Repurposer</div>
            <div className="flex items-center gap-3 text-sm text-[var(--foreground)] font-medium"><CheckCircleIcon className="w-4 h-4 text-[var(--foreground)]" /> 4K Video Exports</div>
            <div className="flex items-center gap-3 text-sm text-[var(--foreground)] font-medium"><CheckCircleIcon className="w-4 h-4 text-[var(--foreground)]" /> Premium Brand Voice AI</div>
            <div className="flex items-center gap-3 text-sm text-[var(--foreground)] font-medium"><CheckCircleIcon className="w-4 h-4 text-[var(--foreground)]" /> Kanban Auto-Publishing</div>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="surface-panel p-8 flex flex-col hover:border-zinc-700 transition-all shadow-2xl">
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Agency</h3>
          <p className="text-[var(--muted)] text-sm mb-6">For teams managing multiple channels.</p>
          <div className="mb-8">
            <span className="text-4xl font-black text-[var(--foreground)]">$99</span>
            <span className="text-[var(--muted)]">/mo</span>
          </div>
          <button className="w-full py-3 rounded-xl bg-[var(--panel)] hover:bg-zinc-800 text-[var(--foreground)] font-bold transition-colors mb-8 border border-[var(--border)]">
            Contact Sales
          </button>
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircleIcon className="w-4 h-4 text-[var(--muted)]" /> 5 Team Seats</div>
            <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircleIcon className="w-4 h-4 text-[var(--muted)]" /> White-label exporting</div>
            <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircleIcon className="w-4 h-4 text-[var(--muted)]" /> API Access</div>
            <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircleIcon className="w-4 h-4 text-[var(--muted)]" /> Priority 24/7 Support</div>
          </div>
        </div>

      </div>
      
      <div className="mt-20 text-center">
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm font-medium">
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
