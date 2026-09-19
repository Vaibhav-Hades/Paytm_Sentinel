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
  marginPercent: number
}

interface SimulationResult {
  productId: number
  changeType: 'PRICE' | 'DISCOUNT'
  newValue: number
  baselineContribution: number
  simulatedContribution: number
  deltaContribution: number
  marginDeltaPercent: number
}

export default function SimulationPage({
  searchParams,
}: {
  searchParams?: Promise<{ productId?: string; changeType?: string }>
}) {
  const resolvedParams = searchParams ? use(searchParams) : {}
  const { selectedMerchant, effectivePlan, setSimulatedPlan, loadingMerchants } = useMerchant()

  const [products, setProducts] = useState<ProductRecord[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [changeType, setChangeType] = useState<'PRICE' | 'DISCOUNT'>('PRICE')
  const [newValue, setNewValue] = useState<number>(0)
  
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true)
  const [runningSimulation, setRunningSimulation] = useState<boolean>(false)
  const [simResult, setSimResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState<boolean>(false)

  // Fetch product catalog for selected merchant
  const fetchProducts = async () => {
    if (!selectedMerchant) return
    try {
      setLoadingProducts(true)
      setError(null)
      setIsLocked(false)

      // Check if plan is FREE
      if (effectivePlan === 'FREE') {
        setIsLocked(true)
        setLoadingProducts(false)
        return
      }

      const res = await fetch(`/api/products?merchantId=${selectedMerchant.id}`)
      if (!res.ok) {
        throw new Error('Failed to load products for merchant')
      }

      const data = await res.json()
      const fetchedProducts: ProductRecord[] = data.products || []
      setProducts(fetchedProducts)

      if (fetchedProducts.length > 0) {
        const initProdId = resolvedParams.productId
          ? parseInt(resolvedParams.productId, 10)
          : fetchedProducts[0].id
        
        const matched = fetchedProducts.find((p) => p.id === initProdId) || fetchedProducts[0]
        setSelectedProductId(matched.id)
        
        const type = resolvedParams.changeType === 'DISCOUNT' ? 'DISCOUNT' : 'PRICE'
        setChangeType(type)
        setNewValue(type === 'PRICE' ? matched.sellingPrice * 1.1 : 10)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred loading product catalog.')
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [selectedMerchant?.id, effectivePlan])

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  const handleProductChange = (prodId: number) => {
    setSelectedProductId(prodId)
    const prod = products.find((p) => p.id === prodId)
    if (prod) {
      setNewValue(changeType === 'PRICE' ? Math.round(prod.sellingPrice * 1.1) : 10)
    }
  }

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) return

    try {
      setRunningSimulation(true)
      setError(null)
      setSimResult(null)

      const payload = {
        productId: selectedProductId,
        changeType,
        newValue: Number(newValue),
      }

      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 403) {
        setIsLocked(true)
        return
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Simulation execution failed')
      }

      const result: SimulationResult = await res.json()
      setSimResult(result)
    } catch (err: any) {
      setError(err.message || 'An unexpected simulation error occurred.')
    } finally {
      setRunningSimulation(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#006686] text-white text-xs font-bold uppercase">
                SIMULATION ENGINE
              </span>
              <span className="text-xs text-[#747781] font-mono">
                Merchant: {selectedMerchant?.name}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#001a45] mt-1">
              Economic Model Simulation
            </h1>
          </div>
        </div>

        {/* Locked State for FREE Subscription Tier */}
        {isLocked && (
          <div className="w-full bg-white rounded-2xl border border-[#e5eeff] p-8 md:p-12 shadow-sm flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#eff4ff] text-[#002e6e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px]">lock</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="px-3 py-1 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-bold w-max mx-auto">
                HTTP 403 — SIMULATION ENGINE GATED ON FREE TIER
              </span>
              <h2 className="text-2xl font-extrabold text-[#0b1c30]">
                Economic Model Simulation Locked
              </h2>
              <p className="text-sm text-[#434750] max-w-lg leading-relaxed">
                What-If price &amp; discount simulations require a <strong>STANDARD</strong> or <strong>PREMIUM</strong> plan to execute deterministic margin projections.
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
        {(loadingProducts || loadingMerchants) && !isLocked && (
          <div className="w-full bg-white p-12 rounded-2xl border border-[#e5eeff] flex flex-col items-center justify-center gap-3 text-[#747781]">
            <span className="w-8 h-8 border-4 border-[#006686] border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm font-medium">Loading merchant product catalog for simulation...</span>
          </div>
        )}

        {/* Main Content */}
        {!loadingProducts && !isLocked && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Simulation Control Panel Form */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 md:p-8 border border-[#e5eeff] shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-3 pb-3 border-b border-[#eff4ff]">
                <div className="w-10 h-10 rounded-xl bg-[#c0e8ff] text-[#004f69] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">tune</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0b1c30]">Simulation Parameters</h3>
                  <p className="text-xs text-[#747781]">Select catalog product &amp; policy parameter</p>
                </div>
              </div>

              <form onSubmit={handleRunSimulation} className="flex flex-col gap-5">
                {/* Product Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="sim-product-select" className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                    Select Target Product
                  </label>
                  <select
                    id="sim-product-select"
                    aria-label="Select Target Product"
                    value={selectedProductId || ''}
                    onChange={(e) => handleProductChange(parseInt(e.target.value, 10))}
                    className="w-full p-3 rounded-lg border border-[#c4c6d2] bg-[#f8f9ff] text-sm text-[#0b1c30] focus:outline-none focus:border-[#006686]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category}) — Selling: ₹{p.sellingPrice} | Cost: ₹{p.costPrice}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Change Type Toggle */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                    Policy Parameter Type
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChangeType('PRICE')
                        if (selectedProduct) setNewValue(Math.round(selectedProduct.sellingPrice * 1.1))
                      }}
                      className={`p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        changeType === 'PRICE'
                          ? 'bg-[#001a45] text-white border-[#001a45] shadow-sm'
                          : 'bg-[#f8f9ff] text-[#434750] border-[#c4c6d2] hover:bg-[#e5eeff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">sell</span>
                      PRICE CHANGE (₹)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setChangeType('DISCOUNT')
                        setNewValue(15)
                      }}
                      className={`p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        changeType === 'DISCOUNT'
                          ? 'bg-[#001a45] text-white border-[#001a45] shadow-sm'
                          : 'bg-[#f8f9ff] text-[#434750] border-[#c4c6d2] hover:bg-[#e5eeff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">percent</span>
                      DISCOUNT CHANGE (%)
                    </button>
                  </div>
                </div>

                {/* New Value Input */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="sim-new-value" className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                    {changeType === 'PRICE' ? 'New Selling Price (₹)' : 'New Campaign Discount (%)'}
                  </label>
                  <input
                    id="sim-new-value"
                    type="number"
                    aria-label={changeType === 'PRICE' ? 'New Selling Price (₹)' : 'New Campaign Discount (%)'}
                    step={changeType === 'PRICE' ? '1' : '0.5'}
                    value={newValue}
                    onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 rounded-lg border border-[#c4c6d2] bg-white font-mono text-lg font-bold text-[#0b1c30] focus:outline-none focus:border-[#006686]"
                  />
                  <span className="text-[11px] text-[#747781]">
                    Current Baseline:{' '}
                    {selectedProduct
                      ? changeType === 'PRICE'
                        ? `₹${selectedProduct.sellingPrice}`
                        : '0% Discount'
                      : 'N/A'}
                  </span>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={runningSimulation}
                  className="w-full py-3.5 rounded-lg bg-[#006686] hover:bg-[#004f69] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 mt-2"
                >
                  {runningSimulation ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Computing Simulation Engine...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      <span>Run Simulation Model</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Simulation Results Display Panel */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 border border-[#e5eeff] shadow-sm flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e5eeff] text-[#002e6e] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">analytics</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#0b1c30]">Deterministic Simulation Results</h3>
                      <p className="text-xs text-[#747781]">Calculated strictly by Simulation Engine</p>
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mt-4 p-4 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold">
                    {error}
                  </div>
                )}

                {/* Placeholder State before running simulation */}
                {!simResult && !error && (
                  <div className="py-16 flex flex-col items-center justify-center text-center gap-3 text-[#747781]">
                    <span className="material-symbols-outlined text-[48px] text-[#c4c6d2]">query_stats</span>
                    <p className="text-sm font-medium">
                      Select a product and policy parameter on the left, then click <strong>Run Simulation Model</strong> to view financial projections.
                    </p>
                  </div>
                )}

                {/* Simulation Output Cards */}
                {simResult && (
                  <div className="flex flex-col gap-6 mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Baseline Contribution */}
                      <div className="p-5 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex flex-col gap-1">
                        <span className="text-xs uppercase font-bold text-[#747781]">Baseline Net Contribution</span>
                        <span className="font-mono text-2xl font-bold text-[#0b1c30]">
                          ₹{simResult.baselineContribution.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Simulated Contribution */}
                      <div className="p-5 rounded-xl bg-[#e5eeff] border border-[#d9e2ff] flex flex-col gap-1">
                        <span className="text-xs uppercase font-bold text-[#002e6e]">Simulated Net Contribution</span>
                        <span className="font-mono text-2xl font-bold text-[#001a45]">
                          ₹{simResult.simulatedContribution.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Financial Deltas Summary Tile */}
                    <div
                      className={`p-6 rounded-xl border flex flex-col gap-3 ${
                        simResult.deltaContribution >= 0
                          ? 'bg-[#e5eeff] border-[#d9e2ff]'
                          : 'bg-[#ffdad6]/40 border-[#ffdad6]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0b1c30]">
                          Projected Economic Delta
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            simResult.deltaContribution >= 0
                              ? 'bg-[#002e6e] text-white'
                              : 'bg-[#ba1a1a] text-white'
                          }`}
                        >
                          {simResult.deltaContribution >= 0 ? '+' : ''}
                          {simResult.deltaContribution.toLocaleString('en-IN')} ₹ / week
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-xs text-[#747781]">Contribution Shift</span>
                          <p className="font-mono text-xl font-bold text-[#0b1c30]">
                            {simResult.deltaContribution >= 0 ? '+' : ''}
                            ₹{simResult.deltaContribution.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-[#747781]">Margin Delta</span>
                          <p className="font-mono text-xl font-bold text-[#0b1c30]">
                            {simResult.marginDeltaPercent >= 0 ? '+' : ''}
                            {simResult.marginDeltaPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action: Convert to Live Experiment */}
              {simResult && (
                <div className="pt-4 border-t border-[#eff4ff] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-[#747781]">
                    Ready to deploy this policy change as a live A/B guardrail experiment?
                  </span>
                  <Link
                    href={`/experiments?create=true&productId=${simResult.productId}&changeType=${simResult.changeType}&newValue=${simResult.newValue}`}
                    className="px-6 py-3 rounded-lg bg-[#001a45] hover:bg-[#002e6e] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">science</span>
                    Convert Simulation to Live Experiment ➔
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
