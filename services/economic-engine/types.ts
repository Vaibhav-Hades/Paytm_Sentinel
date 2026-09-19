export type AnalysisPeriod = 'LAST_7_DAYS' | 'LAST_30_DAYS'

export interface SinglePeriodMetrics {
  revenue: number
  cogs: number
  discount: number
  contribution: number
  contributionMarginPercent: number
  orders: number
  averageOrderValue: number
  discountHeavyOrdersCount: number
  discountHeavyOrdersSharePercent: number
}

export interface MetricComparison {
  revenueDifference: number
  revenueChangePercent: number
  cogsDifference: number
  cogsChangePercent: number
  discountDifference: number
  discountChangePercent: number
  contributionDifference: number
  contributionChangePercent: number
  contributionMarginDifference: number
  ordersDifference: number
  orderChangePercent: number
  discountHeavyOrdersDifference: number
  discountHeavyOrdersChangePercent: number
}

export interface ProductMetrics {
  productId: number
  productName: string
  category: string
  sellingPrice: number
  costPrice: number
  grossMarginPercent: number
  unitsSold: number
  revenue: number
  cogs: number
  discount: number
  contribution: number
}

export interface EconomicMetricsResult {
  merchantId: number
  merchantName: string
  businessType: string
  area: string
  plan: 'FREE' | 'STANDARD' | 'PREMIUM'
  period: AnalysisPeriod
  currentPeriodDates: {
    startDate: Date
    endDate: Date
  }
  previousPeriodDates: {
    startDate: Date
    endDate: Date
  }
  current: SinglePeriodMetrics
  previous: SinglePeriodMetrics
  change: MetricComparison
  products: ProductMetrics[]
}
