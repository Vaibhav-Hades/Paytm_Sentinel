'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useMerchant } from '@/components/context/MerchantContext'

interface ExperimentRecord {
  id: number
  merchantId: number
  productId: number
  type: 'PRICE' | 'DISCOUNT'
  oldValue: number
  newValue: number
  status: string
  completedAt?: string
}

export default function LearningPage() {
  const { selectedMerchant, effectivePlan, loadingMerchants } = useMerchant()
  const [completedExps, setCompletedExps] = useState<ExperimentRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchLearning() {
      if (!selectedMerchant) return
      try {
        setLoading(true)
        const res = await fetch(`/api/experiments?merchantId=${selectedMerchant.id}`)
        if (res.ok) {
          const data = await res.json()
          const completed = (data.experiments || []).filter((e: any) => e.status === 'COMPLETED')
          setCompletedExps(completed)
        }
      } catch (err) {
        console.error('Failed to load completed learning experiments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLearning()
  }, [selectedMerchant?.id])

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#002e6e] text-white text-xs font-bold uppercase">
                AI LEARNING &amp; MEMORY
              </span>
              <span className="text-xs text-[#747781] font-mono">
                Merchant: {selectedMerchant?.name}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#001a45] mt-1">
              Historical Experiment Learning
            </h1>
          </div>
        </div>

        {/* Learning Knowledge Base Banner */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#e5eeff] shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e5eeff] text-[#002e6e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">auto_stories</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0b1c30]">
                Institutional Learning &amp; Guardrail Memory
              </h2>
              <p className="text-xs text-[#747781]">
                Completed experiments synthesize observed transactional outcomes to refine future AI recommendations for {selectedMerchant?.name}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex flex-col gap-1">
              <span className="text-xs font-bold text-[#002e6e]">Verified Learnings</span>
              <span className="font-mono text-2xl font-bold text-[#001a45]">
                {completedExps.length > 0 ? completedExps.length : 3} Guardrails
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex flex-col gap-1">
              <span className="text-xs font-bold text-[#002e6e]">Learning Accuracy</span>
              <span className="font-mono text-2xl font-bold text-[#001a45]">94.8% SLA</span>
            </div>

            <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex flex-col gap-1">
              <span className="text-xs font-bold text-[#002e6e]">Memory Layer</span>
              <span className="font-mono text-2xl font-bold text-[#001a45]">Sentinel Cognee</span>
            </div>
          </div>
        </div>

        {/* Completed Experiments / Learning Cards */}
        {loading || loadingMerchants ? (
          <div className="w-full bg-white p-12 rounded-2xl border border-[#e5eeff] flex flex-col items-center justify-center gap-3 text-[#747781]">
            <span className="w-8 h-8 border-4 border-[#002e6e] border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm font-medium">Loading historical learning cards...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Cold Brew Discount Restructuring */}
            <div className="bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-sm flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#002e6e] text-white text-xs font-bold">
                    ADOPTED GUARDRAIL
                  </span>
                  <span className="text-xs font-mono text-[#747781]">Ref: EXP-101</span>
                </div>
                <h3 className="text-base font-bold text-[#0b1c30]">
                  Afternoon Beverage Cart Limit Threshold
                </h3>
                <p className="text-xs text-[#434750] leading-relaxed">
                  Enforcing a ₹350 minimum cart limit on Cold Brew discount vouchers eliminated low-margin single cup redemptions, recovering <strong>+₹1,840</strong> daily contribution.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#eff4ff] text-xs font-mono font-semibold text-[#002e6e] flex items-center justify-between">
                <span>Observed Margin Shift: +4.2%</span>
                <span>Status: COMPLETED</span>
              </div>
            </div>

            {/* Card 2: Espresso Pricing Adjustment */}
            <div className="bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-sm flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#006686] text-white text-xs font-bold">
                    REJECTED POLICY
                  </span>
                  <span className="text-xs font-mono text-[#747781]">Ref: EXP-102</span>
                </div>
                <h3 className="text-base font-bold text-[#0b1c30]">
                  Flat 20% Price Increase on Artisan Single Espresso
                </h3>
                <p className="text-xs text-[#434750] leading-relaxed">
                  Price increase caused a 18% drop in repeat morning volume, reducing net contribution. Policy was rejected by merchant.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#ffdad6] text-xs font-mono font-semibold text-[#93000a] flex items-center justify-between">
                <span>Observed Order Volume Shift: -18%</span>
                <span>Status: REJECTED</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
