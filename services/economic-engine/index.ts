import { AnalysisPeriod, EconomicMetricsResult, ProductMetrics, SinglePeriodMetrics } from './types'
import { calculateGrossMargin, calculatePercentageChange, getPeriodBoundaries } from './formulas'

export const DISCOUNT_HEAVY_THRESHOLD_PERCENT = 0.15

export interface OrderInput {
  id: number
  productId: number
  quantity: number
  sellingPrice: number
  discount: number
  product?: {
    costPrice: number
  }
  costPrice?: number
}

export interface MerchantInput {
  id: number
  name: string
  businessType: string
  area: string
  plan: 'FREE' | 'STANDARD' | 'PREMIUM'
  products: Array<{
    id: number
    name: string
    category: string
    sellingPrice: number
    costPrice: number
  }>
}

function calculatePeriodMetrics(orders: OrderInput[]): SinglePeriodMetrics {
  let revenue = 0
  let cogs = 0
  let discount = 0
  let discountHeavyOrdersCount = 0

  orders.forEach((order) => {
    const orderRevenue = order.sellingPrice * order.quantity
    const orderCogs = (order.product?.costPrice ?? order.costPrice ?? 0) * order.quantity
    const orderDiscount = order.discount

    revenue += orderRevenue
    cogs += orderCogs
    discount += orderDiscount

    const grossValue = orderRevenue + orderDiscount
    if (grossValue > 0 && orderDiscount / grossValue >= DISCOUNT_HEAVY_THRESHOLD_PERCENT) {
      discountHeavyOrdersCount++
    }
  })

  revenue = Number(revenue.toFixed(2))
  cogs = Number(cogs.toFixed(2))
  discount = Number(discount.toFixed(2))

  const contribution = Number((revenue - cogs - discount).toFixed(2))
  const contributionMarginPercent = revenue > 0 ? Number(((contribution / revenue) * 100).toFixed(2)) : 0
  const orderCount = orders.length
  const averageOrderValue = orderCount > 0 ? Number((revenue / orderCount).toFixed(2)) : 0
  const discountHeavyOrdersSharePercent =
    orderCount > 0 ? Number(((discountHeavyOrdersCount / orderCount) * 100).toFixed(2)) : 0

  return {
    revenue,
    cogs,
    discount,
    contribution,
    contributionMarginPercent,
    orders: orderCount,
    averageOrderValue,
    discountHeavyOrdersCount,
    discountHeavyOrdersSharePercent,
  }
}

/**
 * Pure deterministic calculation function for testing & memory evaluation without DB connection.
 */
export function calculateMetricsFromData(
  merchant: MerchantInput,
  currentOrders: OrderInput[],
  previousOrders: OrderInput[],
  period: AnalysisPeriod = 'LAST_7_DAYS',
  referenceDate: Date = new Date()
): EconomicMetricsResult {
  const boundaries = getPeriodBoundaries(period, referenceDate)
  const currentMetrics = calculatePeriodMetrics(currentOrders)
  const previousMetrics = calculatePeriodMetrics(previousOrders)

  const change = {
    revenueDifference: Number((currentMetrics.revenue - previousMetrics.revenue).toFixed(2)),
    revenueChangePercent: calculatePercentageChange(currentMetrics.revenue, previousMetrics.revenue),

    cogsDifference: Number((currentMetrics.cogs - previousMetrics.cogs).toFixed(2)),
    cogsChangePercent: calculatePercentageChange(currentMetrics.cogs, previousMetrics.cogs),

    discountDifference: Number((currentMetrics.discount - previousMetrics.discount).toFixed(2)),
    discountChangePercent: calculatePercentageChange(currentMetrics.discount, previousMetrics.discount),

    contributionDifference: Number((currentMetrics.contribution - previousMetrics.contribution).toFixed(2)),
    contributionChangePercent: calculatePercentageChange(
      currentMetrics.contribution,
      previousMetrics.contribution
    ),

    contributionMarginDifference: Number(
      (currentMetrics.contributionMarginPercent - previousMetrics.contributionMarginPercent).toFixed(2)
    ),

    ordersDifference: currentMetrics.orders - previousMetrics.orders,
    orderChangePercent: calculatePercentageChange(currentMetrics.orders, previousMetrics.orders),

    discountHeavyOrdersDifference:
      currentMetrics.discountHeavyOrdersCount - previousMetrics.discountHeavyOrdersCount,
    discountHeavyOrdersChangePercent: calculatePercentageChange(
      currentMetrics.discountHeavyOrdersCount,
      previousMetrics.discountHeavyOrdersCount
    ),
  }

  const productsMetricsMap = new Map<number, ProductMetrics>()

  merchant.products.forEach((product) => {
    productsMetricsMap.set(product.id, {
      productId: product.id,
      productName: product.name,
      category: product.category,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      grossMarginPercent: calculateGrossMargin(product.sellingPrice, product.costPrice),
      unitsSold: 0,
      revenue: 0,
      cogs: 0,
      discount: 0,
      contribution: 0,
    })
  })

  currentOrders.forEach((order) => {
    const existing = productsMetricsMap.get(order.productId)
    if (existing) {
      const orderRev = order.sellingPrice * order.quantity
      const orderCogs = (order.product?.costPrice ?? order.costPrice ?? 0) * order.quantity
      const orderDisc = order.discount

      existing.unitsSold += order.quantity
      existing.revenue += orderRev
      existing.cogs += orderCogs
      existing.discount += orderDisc
      existing.contribution += orderRev - orderCogs - orderDisc
    }
  })

  const productsMetrics = Array.from(productsMetricsMap.values()).map((p) => ({
    ...p,
    revenue: Number(p.revenue.toFixed(2)),
    cogs: Number(p.cogs.toFixed(2)),
    discount: Number(p.discount.toFixed(2)),
    contribution: Number(p.contribution.toFixed(2)),
  }))

  return {
    merchantId: merchant.id,
    merchantName: merchant.name,
    businessType: merchant.businessType,
    area: merchant.area,
    plan: merchant.plan,
    period,
    currentPeriodDates: {
      startDate: boundaries.currentStart,
      endDate: boundaries.currentEnd,
    },
    previousPeriodDates: {
      startDate: boundaries.previousStart,
      endDate: boundaries.previousEnd,
    },
    current: currentMetrics,
    previous: previousMetrics,
    change,
    products: productsMetrics,
  }
}

/**
 * Database calculation wrapper using Prisma ORM.
 */
export async function calculateMerchantMetrics(
  merchantId: number,
  period: AnalysisPeriod = 'LAST_7_DAYS',
  referenceDate?: Date
): Promise<EconomicMetricsResult> {
  const { prisma } = await import('../../lib/prisma')

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { products: true },
  })

  if (!merchant) {
    throw new Error(`Merchant with ID ${merchantId} not found.`)
  }

  const boundaries = getPeriodBoundaries(period, referenceDate)

  const currentOrders = await prisma.order.findMany({
    where: {
      merchantId,
      createdAt: {
        gte: boundaries.currentStart,
        lte: boundaries.currentEnd,
      },
    },
    include: { product: true },
  })

  const previousOrders = await prisma.order.findMany({
    where: {
      merchantId,
      createdAt: {
        gte: boundaries.previousStart,
        lt: boundaries.currentStart,
      },
    },
    include: { product: true },
  })

  return calculateMetricsFromData(
    {
      id: merchant.id,
      name: merchant.name,
      businessType: merchant.businessType,
      area: merchant.area,
      plan: merchant.plan as 'FREE' | 'STANDARD' | 'PREMIUM',
      products: merchant.products,
    },
    currentOrders,
    previousOrders,
    period,
    referenceDate
  )
}
