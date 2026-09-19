'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useMerchant } from '@/components/context/MerchantContext'

interface InsightRecord {
  id: number
  merchantId: number
  title: string
  issue: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  status: string
  aiExplanation?: string
  probableDriver?: string
  confidence?: number
  evidence?: any
  allowedActions?: string[]
  createdAt: string
}

export default function InsightsPage() {
  const { selectedMerchant, effectivePlan, setSimulatedPlan, loadingMerchants } = useMerchant()
  const [insights, setInsights] = useState<InsightRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState<boolean>(false)

  const fetchInsights = async () => {
    if (!selectedMerchant) return
    try {
      setLoading(true)
      setError(null)
      setIsLocked(false)

      const res = await fetch(`/api/insights?merchantId=${selectedMerchant.id}`)

      if (res.status === 403) {
        setIsLocked(true)
        setInsights([])
        return
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Failed to fetch insights')
      }

      const data = await res.json()
      setInsights(data.insights || [])
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching insights.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // If user set simulatedPlan to FREE, render locked UI cleanly
    if (effectivePlan === 'FREE') {
      setIsLocked(true)
      setLoading(false)
      setInsights([])
    } else {
      fetchInsights()
    }
  }, [selectedMerchant?.id, effectivePlan])

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#001a45] text-white text-xs font-bold uppercase">
                DETECTION ENGINE
              </span>
              <span className="text-xs text-[#747781] font-mono">
                Merchant ID: #{selectedMerchant?.id}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#001a45] mt-1">
              Sentinel Insights &amp; AI Diagnosis
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchInsights}
              disabled={isLocked || loading}
              className="px-4 py-2 rounded-lg bg-[#eff4ff] text-[#002e6e] text-xs font-semibold hover:bg-[#dce9ff] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Refresh Insights
            </button>
          </div>
        </div>

        {/* Loading State */}
        {(loading || loadingMerchants) && (
          <div className="w-full bg-white p-12 rounded-2xl border border-[#e5eeff] flex flex-col items-center justify-center gap-3 text-[#747781]">
            <span className="w-8 h-8 border-4 border-[#002e6e] border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm font-medium">Running Detection &amp; AI Diagnosis for {selectedMerchant?.name}...</span>
          </div>
        )}

        {/* Locked State for FREE Subscription Tier (Backend 403 Response) */}
        {!loading && isLocked && (
          <div className="w-full bg-white rounded-2xl border border-[#e5eeff] p-8 md:p-12 shadow-sm flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#eff4ff] text-[#002e6e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px]">lock</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="px-3 py-1 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-bold w-max mx-auto">
                HTTP 403 — FEATURE NOT AVAILABLE ON FREE TIER
              </span>
              <h2 className="text-2xl font-extrabold text-[#0b1c30]">
                Sentinel Intelligence Gated
              </h2>
              <p className="text-sm text-[#434750] max-w-lg leading-relaxed">
                Autonomous margin leak detection, AI diagnosis, and probable driver attribution require a <strong>STANDARD (DECIDE)</strong> or <strong>PREMIUM (GROW)</strong> subscription plan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff] text-xs text-left w-full space-y-2">
              <div className="font-bold text-[#002e6e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">stars</span>
                Standard Plan Features Unlocked:
              </div>
              <ul className="list-disc list-inside text-[#434750] space-y-1">
                <li>Automated daily margin leak detection algorithms</li>
                <li>xAI Grok AI economic reasoning &amp; evidence analysis</li>
                <li>Interactive price &amp; discount economic simulation</li>
                <li>Merchant A/B experiment lifecycle execution</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setSimulatedPlan('STANDARD')}
                className="px-6 py-3 rounded-lg bg-[#001a45] text-white text-sm font-semibold hover:bg-[#002e6e] transition-all shadow-md"
              >
                Simulate Upgrade to Standard (Decide)
              </button>
              <Link
                href="/plans"
                className="px-6 py-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-sm font-medium hover:bg-[#dce9ff] transition-colors"
              >
                View Pricing &amp; Capabilities Matrix
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && !isLocked && (
          <div className="w-full bg-[#ffdad6] text-[#93000a] p-6 rounded-2xl border border-[#ba1a1a]/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">error</span>
              <div>
                <h3 className="font-bold text-sm">Failed to load insights</h3>
                <p className="text-xs">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchInsights}
              className="px-4 py-2 bg-[#ba1a1a] text-white rounded-lg text-xs font-semibold hover:bg-[#93000a] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !isLocked && !error && insights.length === 0 && (
          <div className="w-full bg-white p-12 rounded-2xl border border-[#e5eeff] flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#002e6e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0b1c30]">No Active Profit Leaks Detected</h3>
              <p className="text-xs text-[#747781] max-w-md mt-1">
                Sentinel auditing nodes have analyzed recent transactions for {selectedMerchant?.name} and found no active economic margin anomalies.
              </p>
            </div>
          </div>
        )}

        {/* Insights List */}
        {!loading && !isLocked && !error && insights.length > 0 && (
          <div className="flex flex-col gap-6">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white rounded-2xl p-6 md:p-8 border border-[#e5eeff] shadow-sm flex flex-col gap-6 relative overflow-hidden"
              >
                {/* Accent top border */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    insight.severity === 'HIGH'
                      ? 'bg-[#ba1a1a]'
                      : insight.severity === 'MEDIUM'
                      ? 'bg-[#006686]'
                      : 'bg-[#747781]'
                  }`}
                />

                {/* Insight Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        insight.severity === 'HIGH'
                          ? 'bg-[#ffdad6] text-[#ba1a1a]'
                          : 'bg-[#c0e8ff] text-[#004f69]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[28px]">warning</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase ${
                            insight.severity === 'HIGH'
                              ? 'bg-[#ba1a1a] text-white'
                              : 'bg-[#006686] text-white'
                          }`}
                        >
                          {insight.severity} SEVERITY
                        </span>
                        <span className="text-xs font-mono bg-[#eff4ff] px-2 py-0.5 rounded text-[#002e6e] font-semibold">
                          Insight #{insight.id}
                        </span>
                        <span className="text-xs text-[#747781]">
                          Detected {new Date(insight.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#0b1c30] mt-1">{insight.title}</h2>
                    </div>
                  </div>

                  {insight.confidence && (
                    <div className="flex items-center gap-2 bg-[#eff4ff] px-4 py-2 rounded-xl self-start md:self-auto border border-[#dce9ff]">
                      <span className="material-symbols-outlined text-[#07006e] text-[20px]">neurology</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#747781] uppercase font-bold">AI Confidence</span>
                        <span className="font-mono text-sm font-bold text-[#002e6e]">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Issue Description */}
                <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#002e6e]">
                    Detected Anomaly Summary
                  </h4>
                  <p className="text-sm text-[#0b1c30] mt-1 leading-relaxed">{insight.issue}</p>
                </div>

                {/* AI Explanation & Probable Driver */}
                {insight.aiExplanation && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-white border border-[#e5eeff] flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#07006e]">
                        <span className="material-symbols-outlined text-[18px]">psychology</span>
                        <span>xAI Grok Economic Reasoning</span>
                      </div>
                      <p className="text-xs text-[#434750] leading-relaxed">
                        {insight.aiExplanation}
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-[#e5eeff] flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#006686]">
                        <span className="material-symbols-outlined text-[18px]">find_in_page</span>
                        <span>Probable Driver Attribution</span>
                      </div>
                      <p className="text-xs text-[#434750] leading-relaxed">
                        {insight.probableDriver || 'Multiple contributing factors detected across transaction logs.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#eff4ff]">
                  <span className="text-xs text-[#747781]">
                    Allowed Actions: {insight.allowedActions ? insight.allowedActions.join(', ') : 'SIMULATION, EXPERIMENT'}
                  </span>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      href={`/simulation?insightId=${insight.id}`}
                      className="px-5 py-2.5 rounded-lg bg-[#006686] hover:bg-[#004f69] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm w-full sm:w-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">model_training</span>
                      Run Economic Simulation
                    </Link>

                    <Link
                      href={`/experiments?create=true&insightId=${insight.id}`}
                      className="px-5 py-2.5 rounded-lg bg-[#001a45] hover:bg-[#002e6e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm w-full sm:w-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">science</span>
                      Create Guardrail Experiment
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
