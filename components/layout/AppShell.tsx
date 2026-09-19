'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMerchant } from '@/components/context/MerchantContext'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const {
    merchants,
    selectedMerchant,
    setSelectedMerchantId,
    effectivePlan,
    simulatedPlan,
    setSimulatedPlan,
  } = useMerchant()

  const navItems = [
    { label: 'Overview', path: '/', icon: 'grid_view' },
    { label: 'Insights', path: '/insights', icon: 'troubleshoot' },
    { label: 'Simulation', path: '/simulation', icon: 'model_training' },
    { label: 'Experiments', path: '/experiments', icon: 'science' },
    { label: 'Learning', path: '/learning', icon: 'auto_stories' },
    { label: 'Products', path: '/products', icon: 'inventory_2' },
    { label: 'Plans & Pricing', path: '/plans', icon: 'workspace_premium' },
    { label: 'Store Profile', path: '/merchant', icon: 'storefront' },
  ]

  const getPlanBadgeClass = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'bg-[#eff4ff] text-[#434750] border border-[#c4c6d2]'
      case 'STANDARD':
        return 'bg-[#c0e8ff] text-[#004f69] font-semibold'
      case 'PREMIUM':
      default:
        return 'bg-[#002e6e] text-white font-semibold shadow-sm'
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between border-r border-[#e5eeff]">
        <div className="flex flex-col flex-1">
          {/* Logo */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#eff4ff]">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#002e6e] text-white flex items-center justify-center font-bold text-lg">
                P
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#001a45] text-base leading-tight tracking-tight">
                  Paytm Sentinel
                </span>
                <span className="text-xs text-[#747781] font-medium">Economic Copilot</span>
              </div>
            </Link>
          </div>

          {/* SLA Indicator */}
          <div className="px-4 py-3">
            <div className="p-3 rounded-lg bg-[#eff4ff] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#006686] animate-pulse"></span>
                <span className="font-medium text-[#0b1c30]">Engine: v4.2 Pro</span>
              </div>
              <span className="font-mono text-[#434750] font-semibold">99.98% SLA</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-4 mt-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-[#002e6e] text-white font-semibold shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
                      : 'text-[#434750] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer info card */}
        <div className="p-4 m-4 rounded-xl bg-[#eff4ff] flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#002e6e]">
            <span className="material-symbols-outlined text-[18px]">neurology</span>
            <span>Sentinel Core</span>
          </div>
          <p className="text-[11px] text-[#434750] leading-relaxed">
            Powered by Sentinel Intelligence autonomous auditing nodes.
          </p>
        </div>
      </aside>

      {/* Main Container */}
      <div className="pl-72 flex flex-col flex-1 min-h-screen w-full">
        {/* Header */}
        <header className="fixed top-0 left-72 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-[#e5eeff] z-40 px-8 flex items-center justify-between">
          {/* Merchant Dropdown & Plan Switcher */}
          <div className="flex items-center gap-4">
            {/* Merchant Selector */}
            <div className="relative flex items-center">
              <select
                aria-label="Select Merchant Storefront"
                value={selectedMerchant ? selectedMerchant.id : ''}
                onChange={(e) => setSelectedMerchantId(parseInt(e.target.value, 10))}
                className="appearance-none bg-[#eff4ff] pl-10 pr-9 py-2 rounded-lg font-medium text-xs text-[#0b1c30] cursor-pointer hover:bg-[#e5eeff] transition-colors focus:outline-none border border-[#dce9ff]"
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.area} • {m.plan})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#006686] text-[20px] absolute left-3 pointer-events-none">
                storefront
              </span>
              <span className="material-symbols-outlined text-[#747781] text-[18px] absolute right-2.5 pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Plan Badge Pills */}
            <div className="hidden lg:flex items-center gap-1 bg-[#eff4ff] p-1 rounded-full text-xs">
              {(['FREE', 'STANDARD', 'PREMIUM'] as const).map((plan) => {
                const isCurrent = effectivePlan === plan
                return (
                  <button
                    key={plan}
                    onClick={() => setSimulatedPlan(isCurrent && simulatedPlan === plan ? null : plan)}
                    className={`px-3 py-1 rounded-full transition-all text-[11px] font-medium ${
                      isCurrent
                        ? getPlanBadgeClass(plan)
                        : 'text-[#434750] hover:bg-[#dce9ff] hover:text-[#0b1c30]'
                    }`}
                  >
                    {plan === 'FREE' ? 'FREE (SEE)' : plan === 'STANDARD' ? 'STD (DECIDE)' : 'PREMIUM (GROW)'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#eff4ff] text-xs font-mono text-[#0b1c30]">
              <span className="w-2 h-2 rounded-full bg-[#006686] animate-ping"></span>
              <span>Sentinel Active • Real-time Monitoring</span>
            </div>

            <div className="flex items-center gap-3 pl-2 border-l border-[#e5eeff]">
              <div className="w-8 h-8 rounded-full bg-[#002e6e] text-white flex items-center justify-center font-bold text-sm">
                {selectedMerchant ? selectedMerchant.name.charAt(0) : 'M'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold leading-none text-[#0b1c30]">
                  {selectedMerchant ? selectedMerchant.name : 'Merchant'}
                </span>
                <span className="text-[11px] text-[#747781] leading-none mt-1">
                  ID: #{selectedMerchant ? selectedMerchant.id : '1'} • {effectivePlan} Tier
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="w-full pt-16 flex-1 flex flex-col">
          {/* Top Tier Context Preview Banner */}
          <div className="w-full bg-[#e5eeff] border-b border-[#dce9ff] px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#001a45] font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#002e6e]">tune</span>
              <span>
                Simulate Subscription Tier Gating for {selectedMerchant ? selectedMerchant.name : 'Merchant'}:
              </span>
              <span className="font-bold text-[#002e6e]">
                {effectivePlan} {simulatedPlan ? '(Simulated)' : '(Actual DB Plan)'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSimulatedPlan('FREE')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  effectivePlan === 'FREE' ? 'bg-[#ba1a1a] text-white shadow-sm' : 'bg-white text-[#434750] hover:bg-[#f8f9ff]'
                }`}
              >
                FREE (SEE)
              </button>
              <button
                onClick={() => setSimulatedPlan('STANDARD')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  effectivePlan === 'STANDARD' ? 'bg-[#006686] text-white shadow-sm' : 'bg-white text-[#434750] hover:bg-[#f8f9ff]'
                }`}
              >
                STD (DECIDE)
              </button>
              <button
                onClick={() => setSimulatedPlan('PREMIUM')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  effectivePlan === 'PREMIUM' ? 'bg-[#002e6e] text-white shadow-sm' : 'bg-white text-[#434750] hover:bg-[#f8f9ff]'
                }`}
              >
                PREMIUM (GROW)
              </button>
              {simulatedPlan && (
                <button
                  onClick={() => setSimulatedPlan(null)}
                  className="px-2 py-1 text-[10px] text-[#747781] hover:text-[#0b1c30] underline ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="w-full flex-1 p-8 max-w-[1520px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
