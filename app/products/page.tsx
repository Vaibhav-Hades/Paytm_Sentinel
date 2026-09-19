'use client'

import React, { useEffect, useState } from 'react'
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

export default function ProductsPage() {
  const { selectedMerchant, loadingMerchants } = useMerchant()
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchProducts() {
      if (!selectedMerchant) return
      try {
        setLoading(true)
        const res = await fetch(`/api/products?merchantId=${selectedMerchant.id}`)
        if (res.ok) {
          const data = await res.json()
          setProducts(data.products || [])
        }
      } catch (err) {
        console.error('Failed to load merchant products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedMerchant?.id])

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#002e6e] text-white text-xs font-bold uppercase">
                MERCHANT CATALOG
              </span>
              <span className="text-xs text-[#747781] font-mono">
                Merchant: {selectedMerchant?.name}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#001a45] mt-1">
              Store Products &amp; Gross Margins
            </h1>
          </div>
        </div>

        {/* Loading State */}
        {loading || loadingMerchants ? (
          <div className="w-full bg-white p-12 rounded-2xl border border-[#e5eeff] flex flex-col items-center justify-center gap-3 text-[#747781]">
            <span className="w-8 h-8 border-4 border-[#002e6e] border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm font-medium">Loading catalog products for {selectedMerchant?.name}...</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#eff4ff] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0b1c30]">Active Merchant Products ({products.length})</h3>
                <p className="text-xs text-[#747781]">Selling prices, cost prices, and calculated gross margins</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#eff4ff] text-[#002e6e] font-bold uppercase tracking-wider border-b border-[#dce9ff]">
                    <th className="p-4">ID</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Cost Price</th>
                    <th className="p-4">Gross Margin %</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff4ff] text-[#0b1c30]">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#f8f9ff]">
                      <td className="p-4 font-mono font-bold">#{p.id}</td>
                      <td className="p-4 font-bold text-[#001a45]">{p.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-[#eff4ff] text-[#002e6e] font-semibold text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold">₹{p.sellingPrice}</td>
                      <td className="p-4 font-mono text-[#747781]">₹{p.costPrice}</td>
                      <td className="p-4 font-mono font-bold text-[#006686]">
                        {p.marginPercent.toFixed(1)}%
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/simulation?productId=${p.id}&changeType=PRICE`}
                          className="px-3 py-1.5 rounded bg-[#006686] text-white font-bold hover:bg-[#004f69] transition-colors text-[11px] inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">model_training</span>
                          Simulate
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
