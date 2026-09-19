import {
  SimulationBaseline,
  SimulationImpact,
  SimulationRequest,
  SimulationResult,
  SimulationScenario,
} from './types'
import { calculateProjectedOrdersForPrice, DEFAULT_PRICE_ELASTICITY } from './formulas'
import { calculatePercentageChange } from '../economic-engine/formulas'
import { SimulationRequestSchema } from './schemas'

export interface ProductDataForSimulation {
  id: number
  merchantId: number
  name: string
  sellingPrice: number
  costPrice: number
}

export interface OrderDataForSimulation {
  id: number
  productId: number
  quantity: number
  sellingPrice: number
  discount: number
}

/**
 * Pure deterministic simulation engine calculator.
 * Operates purely on supplied product and order facts without modifying any state.
 */
export function simulateScenarioFromData(
  request: SimulationRequest,
  product: ProductDataForSimulation,
  orders: OrderDataForSimulation[],
  elasticity: number = DEFAULT_PRICE_ELASTICITY
): SimulationResult {
  // Validate request parameters strictly
  const validated = SimulationRequestSchema.parse(request)

  if (product.merchantId !== (request.merchantId ?? product.merchantId)) {
    throw new Error(`Product ${product.id} does not belong to merchant ${request.merchantId}.`)
  }

  // 1. Calculate Baseline metrics for this product from observed orders
  const productOrders = orders.filter((o) => o.productId === product.id)
  let baseUnits = 0
  let baseRevenue = 0
  let baseCogs = 0
  let baseDiscount = 0

  productOrders.forEach((o) => {
    const rev = o.sellingPrice * o.quantity
    const cogs = product.costPrice * o.quantity
    baseUnits += o.quantity
    baseRevenue += rev
    baseCogs += cogs
    baseDiscount += o.discount
  })

  // If no historical orders observed, baseline units = 0
  const baselineOrdersCount = baseUnits
  baseRevenue = Number(baseRevenue.toFixed(2))
  baseCogs = Number(baseCogs.toFixed(2))
  baseDiscount = Number(baseDiscount.toFixed(2))

  const baseContribution = Number((baseRevenue - baseCogs - baseDiscount).toFixed(2))
  const baseContributionMarginPercent =
    baseRevenue > 0 ? Number(((baseContribution / baseRevenue) * 100).toFixed(2)) : 0

  const baseline: SimulationBaseline = {
    price: product.sellingPrice,
    orders: baselineOrdersCount,
    revenue: baseRevenue,
    cogs: baseCogs,
    discount: baseDiscount,
    contribution: baseContribution,
    contributionMarginPercent: baseContributionMarginPercent,
  }

  // 2. Scenario Projection based on changeType
  let projectedPrice = product.sellingPrice
  let projectedDiscountValue = 0
  let projectedOrdersCount = baselineOrdersCount
  let modelType = 'LINEAR_PRICE_ELASTICITY'

  if (validated.changeType === 'PRICE') {
    projectedPrice = validated.newValue
    projectedOrdersCount = calculateProjectedOrdersForPrice(
      baselineOrdersCount,
      product.sellingPrice,
      validated.newValue,
      elasticity
    )
    // Assume average per-order discount rate remains constant for price simulation
    const avgDiscountPerUnit = baselineOrdersCount > 0 ? baseDiscount / baselineOrdersCount : 0
    projectedDiscountValue = Number((avgDiscountPerUnit * projectedOrdersCount).toFixed(2))
    modelType = 'LINEAR_PRICE_ELASTICITY'
  } else if (validated.changeType === 'DISCOUNT') {
    // DISCOUNT change: newValue represents the target total discount amount per unit/order
    projectedPrice = product.sellingPrice
    projectedOrdersCount = baselineOrdersCount // Baseline demand assumption
    projectedDiscountValue = Number((validated.newValue * (baselineOrdersCount > 0 ? baselineOrdersCount : 1)).toFixed(2))
    modelType = 'DETERMINISTIC_DISCOUNT_ADJUSTMENT'
  }

  const projectedRevenue = Number((projectedPrice * projectedOrdersCount).toFixed(2))
  const projectedCogs = Number((product.costPrice * projectedOrdersCount).toFixed(2))
  const projectedContribution = Number(
    (projectedRevenue - projectedCogs - projectedDiscountValue).toFixed(2)
  )
  const projectedContributionMarginPercent =
    projectedRevenue > 0 ? Number(((projectedContribution / projectedRevenue) * 100).toFixed(2)) : 0

  const scenario: SimulationScenario = {
    price: projectedPrice,
    discountValue: projectedDiscountValue,
    projectedOrders: projectedOrdersCount,
    projectedRevenue,
    projectedCogs,
    projectedDiscount: projectedDiscountValue,
    projectedContribution,
    projectedContributionMarginPercent,
  }

  // 3. Impact Differences
  const ordersDiff = scenario.projectedOrders - baseline.orders
  const ordersDiffPercent = calculatePercentageChange(scenario.projectedOrders, baseline.orders)

  const revDiff = Number((scenario.projectedRevenue - baseline.revenue).toFixed(2))
  const revDiffPercent = calculatePercentageChange(scenario.projectedRevenue, baseline.revenue)

  const contribDiff = Number((scenario.projectedContribution - baseline.contribution).toFixed(2))
  const contribDiffPercent = calculatePercentageChange(
    scenario.projectedContribution,
    baseline.contribution
  )

  const marginDiff = Number(
    (scenario.projectedContributionMarginPercent - baseline.contributionMarginPercent).toFixed(2)
  )

  const impact: SimulationImpact = {
    ordersDifference: ordersDiff,
    ordersDifferencePercent: ordersDiffPercent,
    revenueDifference: revDiff,
    revenueDifferencePercent: revDiffPercent,
    contributionDifference: contribDiff,
    contributionDifferencePercent: contribDiffPercent,
    contributionMarginDifference: marginDiff,
  }

  return {
    merchantId: product.merchantId,
    productId: product.id,
    productName: product.name,
    changeType: validated.changeType,
    newValue: validated.newValue,
    baseline,
    scenario,
    impact,
    model: {
      type: modelType,
      elasticity: validated.changeType === 'PRICE' ? elasticity : undefined,
      description:
        validated.changeType === 'PRICE'
          ? `Linear price elasticity model (e = ${elasticity})`
          : 'Deterministic discount adjustment scenario',
    },
  }
}

/**
 * Database-backed simulation runner using Prisma ORM.
 * Strictly read-only; never mutates products, orders, or database state.
 */
export async function simulateScenario(
  request: SimulationRequest,
  elasticity: number = DEFAULT_PRICE_ELASTICITY
): Promise<SimulationResult> {
  const { prisma } = await import('../../lib/prisma')

  const product = await prisma.product.findUnique({
    where: { id: request.productId },
  })

  if (!product) {
    throw new Error(`Product with ID ${request.productId} not found.`)
  }

  if (request.merchantId && product.merchantId !== request.merchantId) {
    throw new Error(`Product ${request.productId} does not belong to merchant ${request.merchantId}.`)
  }

  // Fetch product orders across standard 30-day baseline window
  const orders = await prisma.order.findMany({
    where: {
      productId: request.productId,
    },
  })

  return simulateScenarioFromData(request, product, orders, elasticity)
}
