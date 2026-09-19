import { z } from 'zod'
import { ActionType, IssueType, Severity } from '../detection-engine/types'

export const ActionTypeEnum = z.enum([
  'REDUCE_DISCOUNT',
  'INCREASE_PRICE',
  'PROMOTE_HIGH_MARGIN_BUNDLE',
  'REDUCE_LOW_MARGIN_PROMOTION',
  'INCREASE_HIGH_MARGIN_PRODUCT_VISIBILITY',
])

export interface AIRecommendation {
  action: ActionType
  reason: string
  simulationRequired: boolean
}

export interface AIOutput {
  problem: string
  evidence: string[]
  probableDriver: string
  confidence: number
  recommendations: AIRecommendation[]
}

export interface AIEngineInput {
  merchant: {
    id: number
    name: string
    businessType: string
    area: string
    plan: 'FREE' | 'STANDARD' | 'PREMIUM'
  }
  issue: {
    type: IssueType
    severity: Severity
    signals: Record<string, number | string | boolean>
  }
  economicSignals: {
    revenueChange: number
    contributionChange: number
    discountOrderChange: number
    lowMarginOrderChange?: number
    ordersChange?: number
  }
  allowedActions: ActionType[]
}

export type AIReasoningResponse =
  | {
      status: 'SUCCESS'
      data: AIOutput
    }
  | {
      status: 'UNAVAILABLE'
      message: string
    }
