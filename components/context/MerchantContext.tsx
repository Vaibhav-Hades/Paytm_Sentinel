'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface MerchantRecord {
  id: number
  name: string
  businessType: string
  area: string
  plan: 'FREE' | 'STANDARD' | 'PREMIUM'
}

export interface MerchantContextType {
  merchants: MerchantRecord[]
  selectedMerchant: MerchantRecord | null
  setSelectedMerchantId: (id: number) => void
  loadingMerchants: boolean
  effectivePlan: 'FREE' | 'STANDARD' | 'PREMIUM'
  simulatedPlan: 'FREE' | 'STANDARD' | 'PREMIUM' | null
  setSimulatedPlan: (plan: 'FREE' | 'STANDARD' | 'PREMIUM' | null) => void
  refreshMerchants: () => Promise<void>
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined)

export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const [merchants, setMerchants] = useState<MerchantRecord[]>([])
  const [selectedMerchantId, setSelectedMerchantIdState] = useState<number | null>(null)
  const [loadingMerchants, setLoadingMerchants] = useState<boolean>(true)
  const [simulatedPlan, setSimulatedPlan] = useState<'FREE' | 'STANDARD' | 'PREMIUM' | null>(null)

  const fetchMerchants = async () => {
    try {
      setLoadingMerchants(true)
      const res = await fetch('/api/merchants')
      if (res.ok) {
        const data = await res.json()
        if (data.merchants && Array.isArray(data.merchants)) {
          setMerchants(data.merchants)
          if (data.merchants.length > 0 && selectedMerchantId === null) {
            setSelectedMerchantIdState(data.merchants[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch merchants:', err)
    } finally {
      setLoadingMerchants(false)
    }
  }

  useEffect(() => {
    fetchMerchants()
  }, [])

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0] || null

  const setSelectedMerchantId = (id: number) => {
    setSelectedMerchantIdState(id)
    setSimulatedPlan(null) // Reset plan simulation on merchant switch
  }

  const effectivePlan = simulatedPlan || (selectedMerchant ? selectedMerchant.plan : 'PREMIUM')

  return (
    <MerchantContext.Provider
      value={{
        merchants,
        selectedMerchant,
        setSelectedMerchantId,
        loadingMerchants,
        effectivePlan,
        simulatedPlan,
        setSimulatedPlan,
        refreshMerchants: fetchMerchants,
      }}
    >
      {children}
    </MerchantContext.Provider>
  )
}

export function useMerchant() {
  const context = useContext(MerchantContext)
  if (!context) {
    throw new Error('useMerchant must be used within a MerchantProvider')
  }
  return context
}
