'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useMerchant } from '@/components/context/MerchantContext'

interface MerchantMetrics {
  merchantId: number
  period: string
  revenue: number
  revenueChange: number
  cogs: number
  discounts: number
  contribution: number
  contributionChange: number
  contributionMargin: number
  orders: number
  ordersChange: number
  averageOrderValue: number
}

export default function DashboardPage() {
  const { selectedMerchant, effectivePlan, loadingMerchants } = useMerchant()
  const [metrics, setMetrics] = useState<MerchantMetrics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [breakdownOpen, setBreakdownOpen] = useState<boolean>(false)

  const fetchMetrics = async () => {
    if (!selectedMerchant) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/merchant/metrics?merchantId=${selectedMerchant.id}&period=LAST_7_DAYS`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Failed to load metrics')
      }
      const data = await res.json()
      setMetrics(data)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [selectedMerchant?.id])

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#001a45]">
                Good morning, {selectedMerchant ? selectedMerchant.name : 'Merchant'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e5eeff] text-[#002e6e] text-xs font-semibold shadow-sm">
                <span className="material-symbols-outlined text-[14px]">shield_locked</span>
                {effectivePlan} PLAN — {effectivePlan === 'FREE' ? 'SEE' : effectivePlan === 'STANDARD' ? 'DECIDE' : 'GROW'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#747781]">
              <span className="material-symbols-outlined text-[18px] text-[#006686]">storefront</span>
              <span className="font-medium text-[#0b1c30]">{selectedMerchant?.name}</span>
              <span>•</span>
              <span>{selectedMerchant?.area} ({selectedMerchant?.businessType})</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-[#e5eeff]">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-3 h-3 rounded-full bg-[#2bc6ff] animate-ping absolute"></span>
              <span className="w-3 h-3 rounded-full bg-[#006686] relative"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#0b1c30]">Sentinel AI Guard Active</span>
              <span className="text-[11px] text-[#747781]">
                Database verified • Merchant ID #{selectedMerchant?.id}
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(loading || loadingMerchants) && (
          <div className="w-full bg-white p-12 rounded-2xl shadow-sm border border-[#e5eeff] flex flex-col items-center justify-center gap-3 text-[#747781]">
            <span className="w-8 h-8 border-4 border-[#002e6e] border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm font-medium">Loading merchant economic ledger from database...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="w-full bg-[#ffdad6] text-[#93000a] p-6 rounded-2xl border border-[#ba1a1a]/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">error</span>
              <div>
                <h3 className="font-bold text-sm">Unable to load merchant metrics</h3>
                <p className="text-xs">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchMetrics}
              className="px-4 py-2 bg-[#ba1a1a] text-white rounded-lg text-xs font-semibold hover:bg-[#93000a] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Ledger Dashboard Metrics (When Loaded) */}
        {!loading && metrics && (
          <>
            {/* Primary Ledger Metrics Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#001a45] via-[#002e6e] to-[#3d5d9e] p-1 shadow-md">
              <div className="bg-white rounded-[14px] p-6 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#eff4ff]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#002e6e]">
                      <span className="material-symbols-outlined text-[20px]">analytics</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#002e6e]">
                        BUSINESS HEALTH SNAPSHOT
                      </span>
                      <h2 className="text-xl font-bold text-[#0b1c30]">
                        Contribution &amp; Net Margin Ledger (Last 7 Days)
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#eff4ff] px-3 py-1 rounded-full self-start sm:self-auto text-xs text-[#434750]">
                    <span className="material-symbols-outlined text-[#006686] text-[16px]">security</span>
                    <span>Verified by Economic Engine</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Net Contribution Tile */}
                  <div className="sm:col-span-2 lg:col-span-2 p-5 rounded-xl bg-[#eff4ff] flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="flex flex-col gap-1 z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-[#434750] font-bold">
                          Net Contribution
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            metrics.contributionChange >= 0
                              ? 'bg-[#d9e2ff] text-[#002e6e]'
                              : 'bg-[#ffdad6] text-[#93000a]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {metrics.contributionChange >= 0 ? 'trending_up' : 'trending_down'}
                          </span>
                          {metrics.contributionChange >= 0 ? '+' : ''}
                          {metrics.contributionChange.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-mono text-4xl font-extrabold text-[#001a45]">
                          ₹{metrics.contribution.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between z-10 border-t border-[#dce9ff]">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#434750] font-medium">Contribution Margin</span>
                        <span className="font-mono text-lg font-bold text-[#0b1c30]">
                          {metrics.contributionMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gross Revenue Tile */}
                  <div className="p-5 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#434750] font-bold">Gross Revenue</span>
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            metrics.revenueChange >= 0 ? 'bg-[#e5eeff] text-[#002e6e]' : 'bg-[#ffdad6] text-[#93000a]'
                          }`}
                        >
                          {metrics.revenueChange >= 0 ? '+' : ''}
                          {metrics.revenueChange.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="font-mono text-2xl font-bold text-[#0b1c30]">
                          ₹{metrics.revenue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-[#747781] mt-3 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#006686]">insights</span>
                      COGS: ₹{metrics.cogs.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Paid Orders Tile */}
                  <div className="p-5 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#434750] font-bold">Paid Orders</span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#002e6e] text-xs font-semibold">
                          {metrics.ordersChange >= 0 ? '+' : ''}
                          {metrics.ordersChange.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="font-mono text-2xl font-bold text-[#0b1c30]">
                          {metrics.orders}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-[#747781] mt-3">
                      Avg ticket: <span className="font-mono font-semibold text-[#0b1c30]">₹{Math.round(metrics.averageOrderValue)}</span>
                    </span>
                  </div>

                  {/* Discounts Burnt Tile */}
                  <div className="p-5 rounded-xl bg-[#ffdad6]/40 border border-[#ffdad6] shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#93000a] font-bold">Discounts Burnt</span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-xs font-semibold">
                          Leak Risk
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="font-mono text-2xl font-bold text-[#ba1a1a]">
                          ₹{metrics.discounts.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-[#93000a] font-semibold mt-3 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">priority_high</span>
                      Discount ratio: {((metrics.discounts / (metrics.revenue || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sentinel Insight Anomaly Alert Banner */}
            <div className="w-full bg-white rounded-2xl p-6 shadow-md border-l-4 border-l-[#ba1a1a] border border-[#e5eeff] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4 max-w-3xl">
                <div className="w-12 h-12 rounded-xl bg-[#ffdad6] flex items-center justify-center shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[28px] animate-pulse">radar</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#ba1a1a] text-white text-xs font-bold uppercase">
                      DETECT ALERT
                    </span>
                    <h3 className="text-lg font-bold text-[#0b1c30]">SENTINEL INSIGHT: Margin Leak Monitored</h3>
                    <span className="text-xs font-mono bg-[#eff4ff] px-2 py-0.5 rounded text-[#002e6e] font-semibold">
                      Risk Level: HIGH
                    </span>
                  </div>
                  <p className="text-sm text-[#434750] leading-relaxed mt-1">
                    Revenue is <strong className="text-[#001a45] font-mono">{metrics.revenueChange >= 0 ? '+' : ''}{metrics.revenueChange.toFixed(1)}%</strong>, but discounts stand at <strong className="text-[#ba1a1a] font-mono">₹{metrics.discounts.toLocaleString('en-IN')}</strong>. Autonomous auditing engine is tracking margin erosion across active products.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                <Link
                  href="/insights"
                  className="px-5 py-3 rounded-lg bg-[#001a45] hover:bg-[#002e6e] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>WHY? Investigate Leak</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <button
                  onClick={() => setBreakdownOpen(!breakdownOpen)}
                  className="px-4 py-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff] text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <span>{breakdownOpen ? 'Hide Breakdown' : 'View Metric Breakdown'}</span>
                </button>
              </div>
            </div>

            {/* Breakdown Drawer */}
            {breakdownOpen && (
              <div className="bg-[#eff4ff] rounded-xl p-5 border border-[#dce9ff] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0b1c30]">Algorithmic Variance Decomposition</span>
                  <span className="text-xs text-[#747781]">Calculated live by Economic Engine</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-[#e5eeff]">
                    <span className="text-xs text-[#747781]">Total Revenue</span>
                    <p className="font-mono text-lg font-bold text-[#0b1c30]">
                      ₹{metrics.revenue.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#e5eeff]">
                    <span className="text-xs text-[#747781]">Total COGS</span>
                    <p className="font-mono text-lg font-bold text-[#434750]">
                      ₹{metrics.cogs.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#e5eeff]">
                    <span className="text-xs text-[#747781]">Net Contribution</span>
                    <p className="font-mono text-lg font-bold text-[#002e6e]">
                      ₹{metrics.contribution.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Live Diagnostics Card */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#002e6e] text-[20px]">monitor_heart</span>
                      <h4 className="font-bold text-base text-[#0b1c30]">Live Diagnostics</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#002e6e] text-xs font-semibold">
                      Node #01
                    </span>
                  </div>
                  <p className="text-xs text-[#747781]">Continuous ledger integrity and gateway audits.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#eff4ff]">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#0b1c30]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#006686]"></span>
                      <span>Payment Gateway SLA</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#002e6e]">99.98%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#eff4ff]">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#0b1c30]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#006686]"></span>
                      <span>Reconciliation Sync</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#002e6e]">Synced</span>
                  </div>
                </div>
                <Link
                  href="/insights"
                  className="w-full py-2.5 rounded-lg bg-[#eff4ff] text-[#002e6e] hover:bg-[#dce9ff] text-xs font-semibold text-center transition-colors block"
                >
                  Inspect Detection Engine ➔
                </Link>
              </div>

              {/* Simulation Quick Action Card */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006686] text-[20px]">model_training</span>
                      <h4 className="font-bold text-base text-[#0b1c30]">Economic Simulation</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#c0e8ff] text-[#004f69] text-xs font-semibold">
                      Deterministic
                    </span>
                  </div>
                  <p className="text-xs text-[#747781]">Simulate price and discount adjustments before live deployment.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#eff4ff] text-xs space-y-1">
                  <div className="font-bold text-[#0b1c30]">What-If Financial Engine</div>
                  <p className="text-[#434750]">
                    Test price increases or discount thresholds on merchant catalog products.
                  </p>
                </div>
                <Link
                  href="/simulation"
                  className="w-full py-2.5 rounded-lg bg-[#001a45] text-white hover:bg-[#002e6e] text-xs font-semibold text-center transition-colors block"
                >
                  Run Simulation ➔
                </Link>
              </div>

              {/* Experiments Lifecycle Quick Action Card */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#07006e] text-[20px]">science</span>
                      <h4 className="font-bold text-base text-[#0b1c30]">A/B Experiments</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#e1e0ff] text-[#07006c] text-xs font-semibold">
                      Lifecycle
                    </span>
                  </div>
                  <p className="text-xs text-[#747781]">Manage DRAFT ➔ RUNNING ➔ COMPLETED guardrails.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#eff4ff] text-xs space-y-1">
                  <div className="font-bold text-[#0b1c30]">Controlled Deployment</div>
                  <p className="text-[#434750]">
                    Create experiments with merchant approval and measure observed results.
                  </p>
                </div>
                <Link
                  href="/experiments"
                  className="w-full py-2.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff] text-xs font-semibold text-center transition-colors block"
                >
                  View Experiments ➔
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
