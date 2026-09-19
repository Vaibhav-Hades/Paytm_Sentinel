'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useMerchant } from '@/components/context/MerchantContext'

interface ProductRecord {
  id: number
  name: string
  category: string
  sellingPrice: number
  costPrice: number
}

interface InsightRecord {
  id: number
  title: string
  issue: string
}

interface ExperimentRecord {
  id: number
  merchantId: number
  productId: number
  insightId: number
  type: 'PRICE' | 'DISCOUNT'
  oldValue: number
  newValue: number
  durationDays: number
  metric: string
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'CANCELLED'
  startedAt?: string
  completedAt?: string
  createdAt: string
  product?: ProductRecord
  insight?: InsightRecord
}

interface ExperimentResultDTO {
  experimentId: number
  status: string
  ordersDelta: number
  revenueDelta: number
  contributionDelta: number
  marginDeltaPercent: number
  recommendationOutcome: 'ADOPT' | 'REJECT' | 'INCONCLUSIVE'
}

export default function ExperimentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ create?: string; productId?: string; changeType?: string; newValue?: string; insightId?: string }>
}) {
  const resolvedParams = searchParams ? use(searchParams) : {}
  const { selectedMerchant, effectivePlan, setSimulatedPlan, loadingMerchants } = useMerchant()

  const [experiments, setExperiments] = useState<ExperimentRecord[]>([])
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [insights, setInsights] = useState<InsightRecord[]>([])

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState<boolean>(false)

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false)
  const [creating, setCreating] = useState<boolean>(false)
  const [formInsightId, setFormInsightId] = useState<number | undefined>(undefined)
  const [formProductId, setFormProductId] = useState<number | undefined>(undefined)
  const [formType, setFormType] = useState<'PRICE' | 'DISCOUNT'>('PRICE')
  const [formOldValue, setFormOldValue] = useState<number>(100)
  const [formNewValue, setFormNewValue] = useState<number>(110)
  const [formDurationDays, setFormDurationDays] = useState<number>(7)

  // Results Modal State
  const [selectedResult, setSelectedResult] = useState<ExperimentResultDTO | null>(null)
  const [loadingResultId, setLoadingResultId] = useState<number | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const fetchData = async () => {
    if (!selectedMerchant) return
    try {
      setLoading(true)
      setError(null)
      setIsLocked(false)

      if (effectivePlan === 'FREE') {
        setIsLocked(true)
        setLoading(false)
        return
      }

      // Fetch Experiments, Products, Insights in parallel
      const [expRes, prodRes, insRes] = await Promise.all([
        fetch(`/api/experiments?merchantId=${selectedMerchant.id}`),
        fetch(`/api/products?merchantId=${selectedMerchant.id}`),
        fetch(`/api/insights?merchantId=${selectedMerchant.id}`),
      ])

      if (expRes.status === 403 || prodRes.status === 403 || insRes.status === 403) {
        setIsLocked(true)
        return
      }

      if (!expRes.ok) throw new Error('Failed to load experiments')
      const expData = await expRes.json()
      setExperiments(expData.experiments || [])

      if (prodRes.ok) {
        const pData = await prodRes.json()
        setProducts(pData.products || [])
        if (pData.products?.length > 0 && !formProductId) {
          setFormProductId(pData.products[0].id)
          setFormOldValue(pData.products[0].sellingPrice)
          setFormNewValue(Math.round(pData.products[0].sellingPrice * 1.1))
        }
      }

      if (insRes.ok) {
        const iData = await insRes.json()
        setInsights(iData.insights || [])
        if (iData.insights?.length > 0 && !formInsightId) {
          setFormInsightId(iData.insights[0].id)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred loading experiment data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Handle incoming URL searchParams for auto-opening create modal
    if (resolvedParams.create === 'true') {
      setIsCreateOpen(true)
      if (resolvedParams.productId) setFormProductId(parseInt(resolvedParams.productId, 10))
      if (resolvedParams.changeType === 'DISCOUNT') setFormType('DISCOUNT')
      if (resolvedParams.newValue) setFormNewValue(parseFloat(resolvedParams.newValue))
      if (resolvedParams.insightId) setFormInsightId(parseInt(resolvedParams.insightId, 10))
    }
  }, [selectedMerchant?.id, effectivePlan])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMerchant || !formProductId) return

    try {
      setCreating(true)
      setError(null)

      const payload = {
        merchantId: selectedMerchant.id,
        insightId: formInsightId || (insights[0] ? insights[0].id : 1),
        productId: formProductId,
        type: formType,
        oldValue: Number(formOldValue),
        newValue: Number(formNewValue),
        durationDays: Number(formDurationDays),
        metric: formType === 'PRICE' ? 'MARGIN_IMPACT' : 'DISCOUNT_BURN',
      }

      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Failed to create experiment')
      }

      setActionMessage('Experiment successfully created in DRAFT status!')
      setIsCreateOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to create experiment.')
    } finally {
      setCreating(false)
    }
  }

  const handleApprove = async (experimentId: number) => {
    if (!selectedMerchant) return
    try {
      setActionMessage(null)
      setError(null)
      const res = await fetch(`/api/experiments/${experimentId}/approve?merchantId=${selectedMerchant.id}`, {
        method: 'POST',
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Failed to approve experiment')
      }

      setActionMessage(`Experiment #${experimentId} approved and transitioned to RUNNING status.`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to approve experiment.')
    }
  }

  const handleFetchResult = async (experimentId: number) => {
    if (!selectedMerchant) return
    try {
      setLoadingResultId(experimentId)
      setError(null)
      const res = await fetch(`/api/experiments/${experimentId}/result?merchantId=${selectedMerchant.id}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Failed to fetch experiment result')
      }

      const data: ExperimentResultDTO = await res.json()
      setSelectedResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch experiment result.')
    } finally {
      setLoadingResultId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-[#eff4ff] text-[#002e6e] border border-[#dce9ff]'
      case 'RUNNING':
        return 'bg-[#c0e8ff] text-[#004f69] font-bold animate-pulse'
      case 'COMPLETED':
        return 'bg-[#e5eeff] text-[#001a45] font-bold'
      case 'CANCELLED':
      default:
        return 'bg-[#ffdad6] text-[#93000a]'
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#07006e] text-white text-xs font-bold uppercase">
                EXPERIMENT ENGINE
              </span>
              <span className="text-xs text-[#747781] font-mono">
                Merchant: {selectedMerchant?.name}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#001a45] mt-1">
              A/B Guardrail Experiments
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              disabled={isLocked}
              className="px-5 py-2.5 rounded-lg bg-[#001a45] hover:bg-[#002e6e] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create New Experiment
            </button>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionMessage && (
          <div className="p-4 rounded-xl bg-[#e5eeff] border border-[#002e6e]/20 text-[#001a45] text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="hover:opacity-70">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Locked State for FREE Tier */}
        {isLocked && (
          <div className="w-full bg-white rounded-2xl border border-[#e5eeff] p-8 md:p-12 shadow-sm flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#eff4ff] text-[#002e6e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px]">lock</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="px-3 py-1 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-bold w-max mx-auto">
                HTTP 403 — EXPERIMENT ENGINE GATED ON FREE TIER
              </span>
              <h2 className="text-2xl font-extrabold text-[#0b1c30]">
                Experiment Engine Gated
              </h2>
              <p className="text-sm text-[#434750] max-w-lg leading-relaxed">
                A/B experiment creation, merchant approval workflows, and transactional result verification require a <strong>STANDARD</strong> or <strong>PREMIUM</strong> plan.
              </p>
            </div>
            <button
              onClick={() => setSimulatedPlan('STANDARD')}
              className="px-6 py-3 rounded-lg bg-[#001a45] text-white text-sm font-semibold hover:bg-[#002e6e] transition-all shadow-md"
            >
              Simulate Upgrade to Standard Plan
            </button>
          </div>
        )}

        {/* Loading State */}
        {(loading || loadingMerchants) && !isLocked && (
          <div className="w-full bg-white p-12 rounded-2xl border border-[#e5eeff] flex flex-col items-center justify-center gap-3 text-[#747781]">
            <span className="w-8 h-8 border-4 border-[#07006e] border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm font-medium">Loading experiments for {selectedMerchant?.name}...</span>
          </div>
        )}

        {/* Error Banner */}
        {error && !isLocked && (
          <div className="p-4 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:opacity-70">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !isLocked && experiments.length === 0 && (
          <div className="w-full bg-white p-12 rounded-2xl border border-[#e5eeff] flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#002e6e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">science</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0b1c30]">No Active Experiments</h3>
              <p className="text-xs text-[#747781] max-w-md mt-1">
                You haven't launched any guardrail experiments for {selectedMerchant?.name} yet. Click <strong>Create New Experiment</strong> above to get started.
              </p>
            </div>
          </div>
        )}

        {/* Experiments List */}
        {!loading && !isLocked && experiments.length > 0 && (
          <div className="flex flex-col gap-6">
            {experiments.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-sm flex flex-col gap-5 relative overflow-hidden"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eff4ff]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e5eeff] text-[#002e6e] flex items-center justify-center font-bold">
                      #{exp.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs ${getStatusBadge(exp.status)}`}>
                          STATUS: {exp.status}
                        </span>
                        <span className="text-xs font-mono text-[#747781]">
                          Type: {exp.type}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#0b1c30] mt-0.5">
                        Product #{exp.productId} Policy Optimization ({exp.durationDays} Days)
                      </h3>
                    </div>
                  </div>

                  <span className="text-xs text-[#747781]">
                    Created: {new Date(exp.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Values Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                    <span className="text-[#747781]">Baseline Value</span>
                    <p className="font-mono text-lg font-bold text-[#0b1c30]">
                      {exp.type === 'PRICE' ? `₹${exp.oldValue}` : `${exp.oldValue}%`}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                    <span className="text-[#002e6e] font-bold">Experiment Target Value</span>
                    <p className="font-mono text-lg font-bold text-[#001a45]">
                      {exp.type === 'PRICE' ? `₹${exp.newValue}` : `${exp.newValue}%`}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                    <span className="text-[#747781]">Linked Insight Trace</span>
                    <p className="font-mono text-sm font-bold text-[#0b1c30] mt-1">
                      Insight #{exp.insightId}
                    </p>
                  </div>
                </div>

                {/* Action Row per status */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#eff4ff]">
                  <div className="text-xs text-[#747781]">
                    {exp.status === 'DRAFT' && 'Draft created. Awaiting explicit merchant approval before activation.'}
                    {exp.status === 'RUNNING' && 'Experiment active. Transactional data is being monitored.'}
                    {exp.status === 'COMPLETED' && `Experiment completed on ${exp.completedAt ? new Date(exp.completedAt).toLocaleDateString() : 'N/A'}.`}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                    {exp.status === 'DRAFT' && (
                      <button
                        onClick={() => handleApprove(exp.id)}
                        className="px-5 py-2.5 rounded-lg bg-[#001a45] hover:bg-[#002e6e] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm w-full sm:w-auto justify-center"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Approve &amp; Activate Experiment
                      </button>
                    )}

                    {(exp.status === 'RUNNING' || exp.status === 'COMPLETED') && (
                      <button
                        onClick={() => handleFetchResult(exp.id)}
                        disabled={loadingResultId === exp.id}
                        className="px-5 py-2.5 rounded-lg bg-[#006686] hover:bg-[#004f69] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm w-full sm:w-auto justify-center disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">analytics</span>
                        {loadingResultId === exp.id ? 'Fetching Result...' : 'View Observed Results'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Experiment */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-[#001a45]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-xl border border-[#e5eeff] flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#001a45] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">science</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0b1c30]">Create A/B Experiment</h3>
                    <p className="text-xs text-[#747781]">Configured in DRAFT status</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="text-[#747781] hover:text-[#0b1c30]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
                {/* Target Product */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="exp-prod-select" className="font-bold text-[#0b1c30]">Select Target Product</label>
                  <select
                    id="exp-prod-select"
                    aria-label="Select Target Product"
                    value={formProductId || ''}
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10)
                      setFormProductId(id)
                      const prod = products.find((p) => p.id === id)
                      if (prod) setFormOldValue(prod.sellingPrice)
                    }}
                    className="p-3 rounded-lg border border-[#c4c6d2] bg-[#f8f9ff] text-sm text-[#0b1c30]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Baseline: ₹{p.sellingPrice})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Change Type */}
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[#0b1c30]">Policy Change Type</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormType('PRICE')}
                      className={`p-2.5 rounded-lg font-bold ${
                        formType === 'PRICE' ? 'bg-[#001a45] text-white' : 'bg-[#f8f9ff] text-[#434750] border'
                      }`}
                    >
                      PRICE CHANGE
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('DISCOUNT')}
                      className={`p-2.5 rounded-lg font-bold ${
                        formType === 'DISCOUNT' ? 'bg-[#001a45] text-white' : 'bg-[#f8f9ff] text-[#434750] border'
                      }`}
                    >
                      DISCOUNT CHANGE
                    </button>
                  </div>
                </div>

                {/* Old vs New Values */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="exp-old-val" className="font-bold text-[#0b1c30]">Baseline Value</label>
                    <input
                      id="exp-old-val"
                      type="number"
                      aria-label="Baseline Value"
                      value={formOldValue}
                      onChange={(e) => setFormOldValue(parseFloat(e.target.value) || 0)}
                      className="p-3 rounded-lg border border-[#c4c6d2] font-mono text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="exp-new-val" className="font-bold text-[#0b1c30]">Experiment Target Value</label>
                    <input
                      id="exp-new-val"
                      type="number"
                      aria-label="Experiment Target Value"
                      value={formNewValue}
                      onChange={(e) => setFormNewValue(parseFloat(e.target.value) || 0)}
                      className="p-3 rounded-lg border border-[#c4c6d2] font-mono text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="exp-duration" className="font-bold text-[#0b1c30]">Experiment Duration (Days)</label>
                  <input
                    id="exp-duration"
                    type="number"
                    aria-label="Experiment Duration (Days)"
                    value={formDurationDays}
                    onChange={(e) => setFormDurationDays(parseInt(e.target.value, 10) || 7)}
                    className="p-3 rounded-lg border border-[#c4c6d2] font-mono text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eff4ff]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-lg bg-[#001a45] text-white font-bold hover:bg-[#002e6e] disabled:opacity-50"
                  >
                    {creating ? 'Creating DRAFT...' : 'Create DRAFT Experiment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Experiment Results */}
        {selectedResult && (
          <div className="fixed inset-0 z-50 bg-[#001a45]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-xl border border-[#e5eeff] flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#006686] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">analytics</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0b1c30]">
                      Observed Experiment Result #{selectedResult.experimentId}
                    </h3>
                    <p className="text-xs text-[#747781]">Derived from transactional orders</p>
                  </div>
                </div>
                <button onClick={() => setSelectedResult(null)} className="text-[#747781] hover:text-[#0b1c30]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-4 text-xs">
                {/* Recommendation Badge */}
                <div className="p-4 rounded-xl bg-[#e5eeff] border border-[#d9e2ff] flex items-center justify-between">
                  <span className="font-bold text-[#002e6e]">Recommendation Outcome</span>
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-xs ${
                      selectedResult.recommendationOutcome === 'ADOPT'
                        ? 'bg-[#002e6e] text-white'
                        : selectedResult.recommendationOutcome === 'REJECT'
                        ? 'bg-[#ba1a1a] text-white'
                        : 'bg-[#747781] text-white'
                    }`}
                  >
                    {selectedResult.recommendationOutcome}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                    <span className="text-[#747781]">Orders Delta</span>
                    <p className="font-mono text-lg font-bold text-[#0b1c30]">
                      {selectedResult.ordersDelta >= 0 ? '+' : ''}
                      {selectedResult.ordersDelta}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                    <span className="text-[#747781]">Revenue Delta</span>
                    <p className="font-mono text-lg font-bold text-[#0b1c30]">
                      {selectedResult.revenueDelta >= 0 ? '+' : ''}
                      ₹{selectedResult.revenueDelta.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                    <span className="text-[#002e6e] font-bold">Contribution Shift</span>
                    <p className="font-mono text-lg font-bold text-[#001a45]">
                      {selectedResult.contributionDelta >= 0 ? '+' : ''}
                      ₹{selectedResult.contributionDelta.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                    <span className="text-[#002e6e] font-bold">Margin Delta %</span>
                    <p className="font-mono text-lg font-bold text-[#001a45]">
                      {selectedResult.marginDeltaPercent >= 0 ? '+' : ''}
                      {selectedResult.marginDeltaPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#eff4ff]">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="px-6 py-2.5 rounded-lg bg-[#001a45] text-white font-bold hover:bg-[#002e6e]"
                >
                  Close Results Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
