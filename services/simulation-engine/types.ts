import { z } from 'zod'

export type SimulationChangeType = 'PRICE' | 'DISCOUNT'

export const SimulationChangeTypeEnum = z.enum(['PRICE', 'DISCOUNT'])

export interface SimulationRequest {
  merchantId?: number
  productId: number
  changeType: SimulationChangeType
  newValue: number
}

export interface SimulationBaseline {
  price: number
  orders: number
  revenue: number
  cogs: number
  discount: number
  contribution: number
  contributionMarginPercent: number
}

export interface SimulationScenario {
  price: number
  discountValue: number
  projectedOrders: number
  projectedRevenue: number
  projectedCogs: number
  projectedDiscount: number
  projectedContribution: number
  projectedContributionMarginPercent: number
}

export interface SimulationImpact {
  ordersDifference: number
  ordersDifferencePercent: number
  revenueDifference: number
  revenueDifferencePercent: number
  contributionDifference: number
  contributionDifferencePercent: number
  contributionMarginDifference: number
}

export interface SimulationModelDetails {
  type: string
  elasticity?: number
  description?: string
}

export interface SimulationResult {
  merchantId: number
  productId: number
  productName: string
  changeType: SimulationChangeType
  newValue: number
  baseline: SimulationBaseline
  scenario: SimulationScenario
  impact: SimulationImpact
  model: SimulationModelDetails
}
