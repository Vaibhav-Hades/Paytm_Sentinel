export type IssueType =
  | 'REVENUE_CONTRIBUTION_DIVERGENCE'
  | 'DISCOUNT_LEAK'
  | 'PRODUCT_MIX_LEAK'
  | 'HIGH_MARGIN_OPPORTUNITY'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH'

export type ActionType =
  | 'REDUCE_DISCOUNT'
  | 'INCREASE_PRICE'
  | 'PROMOTE_HIGH_MARGIN_BUNDLE'
  | 'REDUCE_LOW_MARGIN_PROMOTION'
  | 'INCREASE_HIGH_MARGIN_PRODUCT_VISIBILITY'

export interface DetectionIssue {
  issueType: IssueType
  severity: Severity
  title: string
  description: string
  signals: Record<string, number | string | boolean>
  allowedActions: ActionType[]
}

export interface DetectionResult {
  merchantId: number
  merchantName: string
  plan: 'FREE' | 'STANDARD' | 'PREMIUM'
  issues: DetectionIssue[]
}
