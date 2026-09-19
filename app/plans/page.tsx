'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useMerchant } from '@/components/context/MerchantContext'

export default function PlansPage() {
  const { selectedMerchant, effectivePlan, setSimulatedPlan } = useMerchant()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#001a45] text-white text-xs font-bold uppercase">
                TIER CAPABILITIES MATRIX
              </span>
              <span className="text-xs text-[#747781] font-mono">
                Current DB Plan: {selectedMerchant?.plan}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#001a45] mt-1">
              Subscription Tiers &amp; Capabilities
            </h1>
          </div>
        </div>

        {/* Tier Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE Tier */}
          <div
            className={`bg-white rounded-2xl p-6 md:p-8 border shadow-sm flex flex-col justify-between gap-6 transition-all ${
              effectivePlan === 'FREE' ? 'border-[#002e6e] ring-2 ring-[#002e6e]' : 'border-[#e5eeff]'
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#eff4ff] text-[#434750] text-xs font-bold">
                  SEE
                </span>
                {effectivePlan === 'FREE' && (
                  <span className="text-xs font-bold text-[#002e6e]">CURRENT ACTIVE</span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-[#0b1c30]">FREE TIER</h2>
              <p className="text-xs text-[#747781] leading-relaxed">
                Basic historical observation, sales reporting, and primary economic ledger tracking.
              </p>

              <div className="border-t border-[#eff4ff] pt-4 flex flex-col gap-2.5 text-xs text-[#434750]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#002e6e] text-[18px]">check_circle</span>
                  <span>Gross Revenue &amp; COGS Ledger</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#002e6e] text-[18px]">check_circle</span>
                  <span>Historical Sales Overview</span>
                </div>
                <div className="flex items-center gap-2 text-[#747781]">
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  <span className="line-through">Automated Leak Detection</span>
                </div>
                <div className="flex items-center gap-2 text-[#747781]">
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  <span className="line-through">xAI Grok AI Diagnosis</span>
                </div>
                <div className="flex items-center gap-2 text-[#747781]">
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  <span className="line-through">Economic Simulations</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSimulatedPlan('FREE')}
              className="w-full py-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-xs font-bold hover:bg-[#dce9ff] transition-colors"
            >
              Simulate FREE Experience
            </button>
          </div>

          {/* STANDARD Tier */}
          <div
            className={`bg-white rounded-2xl p-6 md:p-8 border shadow-sm flex flex-col justify-between gap-6 transition-all ${
              effectivePlan === 'STANDARD' ? 'border-[#006686] ring-2 ring-[#006686]' : 'border-[#e5eeff]'
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#c0e8ff] text-[#004f69] text-xs font-bold">
                  DECIDE
                </span>
                {effectivePlan === 'STANDARD' && (
                  <span className="text-xs font-bold text-[#006686]">CURRENT ACTIVE</span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-[#0b1c30]">STANDARD TIER</h2>
              <p className="text-xs text-[#747781] leading-relaxed">
                Autonomous anomaly detection, xAI Grok diagnosis, economic simulations, and A/B experiments.
              </p>

              <div className="border-t border-[#eff4ff] pt-4 flex flex-col gap-2.5 text-xs text-[#434750]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006686] text-[18px]">check_circle</span>
                  <span>Automated Leak Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006686] text-[18px]">check_circle</span>
                  <span>xAI Grok AI Economic Reasoning</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006686] text-[18px]">check_circle</span>
                  <span>Price &amp; Discount Simulations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006686] text-[18px]">check_circle</span>
                  <span>A/B Experiment Lifecycle</span>
                </div>
                <div className="flex items-center gap-2 text-[#747781]">
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  <span className="line-through">Peer Benchmarking</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSimulatedPlan('STANDARD')}
              className="w-full py-3 rounded-lg bg-[#006686] text-white text-xs font-bold hover:bg-[#004f69] transition-colors shadow-sm"
            >
              Simulate STANDARD Experience
            </button>
          </div>

          {/* PREMIUM Tier */}
          <div
            className={`bg-white rounded-2xl p-6 md:p-8 border shadow-sm flex flex-col justify-between gap-6 transition-all ${
              effectivePlan === 'PREMIUM' ? 'border-[#002e6e] ring-2 ring-[#002e6e]' : 'border-[#e5eeff]'
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#002e6e] text-white text-xs font-bold">
                  GROW
                </span>
                {effectivePlan === 'PREMIUM' && (
                  <span className="text-xs font-bold text-[#002e6e]">CURRENT ACTIVE</span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-[#0b1c30]">PREMIUM TIER</h2>
              <p className="text-xs text-[#747781] leading-relaxed">
                Full intelligence suite: Peer benchmarking, historical Cognee memory, and predictive expansion.
              </p>

              <div className="border-t border-[#eff4ff] pt-4 flex flex-col gap-2.5 text-xs text-[#434750]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#002e6e] text-[18px]">check_circle</span>
                  <span>Everything in STANDARD Tier</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#002e6e] text-[18px]">check_circle</span>
                  <span>Peer Intelligence Benchmarking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#002e6e] text-[18px]">check_circle</span>
                  <span>Historical Cognee Graph Context</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#002e6e] text-[18px]">check_circle</span>
                  <span>Personalized Growth Strategy</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSimulatedPlan('PREMIUM')}
              className="w-full py-3 rounded-lg bg-[#001a45] text-white text-xs font-bold hover:bg-[#002e6e] transition-colors shadow-sm"
            >
              Simulate PREMIUM Experience
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
