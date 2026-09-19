import { ExperimentMetric, ExperimentStatus } from '@prisma/client'

export { ExperimentMetric, ExperimentStatus }

export type ExperimentType =
  | 'PRICE_TEST'
  | 'DISCOUNT_TEST'
  | 'REDUCE_DISCOUNT'
  | 'INCREASE_PRICE'
  | 'BUNDLE_PROMOTION'
  | string

export interface CreateExperimentInput {
  merchantId: number
  productId: number
  insightId: number
  type: ExperimentType
  oldValue: number
  newValue: number
  durationDays?: number
  metric?: ExperimentMetric
}

export interface ApproveExperimentInput {
  experimentId: number
  merchantId?: number
}

export interface CompleteExperimentInput {
  experimentId: number
  merchantId?: number
  referenceDate?: Date
}

/**
 * Canonical Internal ExperimentResultDTO
 * Exactly matches specification definition in ARCHITECTURE.md §19
 */
export interface ExperimentResultDTO {
  baselineContribution: number
  experimentContribution: number
  baselineOrders: number
  experimentOrders: number
  contributionDifference: number
  contributionChangePercent: number
  orderDifference: number
  orderChangePercent: number
}

/**
 * Public REST API Response Shape for GET /api/experiments/:id/result
 * Nested structure for client consumption as defined in ARCHITECTURE.md §19 & API_CONTRACT.md
 */
export interface PublicExperimentResultDTO {
  baseline: {
    contribution: number
    orders: number
  }
  result: {
    contribution: number
    orders: number
  }
  impact: {
    contributionDifference: number
    contributionChangePercent: number
    orderDifference: number
    orderChangePercent: number
  }
}

export interface ProductDataForExperiment {
  id: number
  merchantId: number
  name?: string
  sellingPrice: number
  costPrice: number
}

export interface OrderDataForExperiment {
  id: number
  productId: number
  quantity: number
  sellingPrice: number
  discount: number
  createdAt?: Date
}
