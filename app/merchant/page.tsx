'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useMerchant } from '@/components/context/MerchantContext'

export default function MerchantProfilePage() {
  const { selectedMerchant, effectivePlan } = useMerchant()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#002e6e] text-white text-xs font-bold uppercase">
                STOREFRONT PROFILE
              </span>
              <span className="text-xs text-[#747781] font-mono">
                Merchant ID: #{selectedMerchant?.id}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#001a45] mt-1">
              {selectedMerchant?.name}
            </h1>
          </div>
        </div>

        {/* Profile Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Storefront Info */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 md:p-8 border border-[#e5eeff] shadow-sm flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#002e6e] flex items-center justify-center font-bold text-xl">
                  {selectedMerchant?.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0b1c30]">{selectedMerchant?.name}</h2>
                  <p className="text-xs text-[#747781]">
                    {selectedMerchant?.area} • {selectedMerchant?.businessType}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#eff4ff] text-xs">
                <div className="flex justify-between p-3 rounded-lg bg-[#f8f9ff]">
                  <span className="text-[#747781]">Database Plan</span>
                  <span className="font-bold text-[#001a45]">{selectedMerchant?.plan}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-[#f8f9ff]">
                  <span className="text-[#747781]">Active Effective Plan</span>
                  <span className="font-bold text-[#006686]">{effectivePlan}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-[#f8f9ff]">
                  <span className="text-[#747781]">Node Identifier</span>
                  <span className="font-mono font-bold text-[#0b1c30]">#CP-DEL-088{selectedMerchant?.id}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-[#f8f9ff]">
                  <span className="text-[#747781]">Soundbox Gateway</span>
                  <span className="font-semibold text-[#002e6e]">Connected &amp; Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Peer Intelligence Benchmarking */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 md:p-8 border border-[#e5eeff] shadow-sm flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006686] text-[22px]">leaderboard</span>
                  <h3 className="text-lg font-bold text-[#0b1c30]">Peer Intelligence Cluster</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#002e6e] text-xs font-semibold">
                  {selectedMerchant?.area}
                </span>
              </div>
              <p className="text-xs text-[#747781]">
                Anonymized comparison of {selectedMerchant?.name} against nearby regional merchants in the same business category.
              </p>

              {effectivePlan === 'FREE' ? (
                <div className="p-6 rounded-xl bg-[#eff4ff] border border-[#dce9ff] text-center flex flex-col gap-2 mt-2">
                  <span className="material-symbols-outlined text-[32px] text-[#002e6e] mx-auto">lock</span>
                  <span className="font-bold text-xs text-[#001a45]">Peer Benchmarking Gated</span>
                  <p className="text-[11px] text-[#434750]">
                    Requires STANDARD or PREMIUM plan to view cluster benchmarks.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-[#f8f9ff] flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-[#747781]">Contribution Margin vs Peer Avg</span>
                      <span className="font-bold text-[#002e6e]">24.8% vs 31.2% Peer Avg</span>
                    </div>
                    <div className="w-full bg-[#e5eeff] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#002e6e] h-full rounded-full w-[65%]"></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#f8f9ff] flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-[#747781]">Discount Burn Ratio vs Peer Avg</span>
                      <span className="font-bold text-[#ba1a1a]">18.4% (Top 10% Burn)</span>
                    </div>
                    <div className="w-full bg-[#ffdad6] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#ba1a1a] h-full rounded-full w-[80%]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
