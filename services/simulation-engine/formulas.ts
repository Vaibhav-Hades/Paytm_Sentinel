import { calculatePercentageChange } from '../economic-engine/formulas'

export const DEFAULT_PRICE_ELASTICITY = 0.8

/**
 * Calculates projected orders given a price change using linear price elasticity.
 * Formula: projectedOrders = Math.round(currentOrders * (1 - elasticity * ((newPrice - currentPrice) / currentPrice)))
 * Projected orders are bounded below by 0.
 */
export function calculateProjectedOrdersForPrice(
  currentOrders: number,
  currentPrice: number,
  newPrice: number,
  elasticity: number = DEFAULT_PRICE_ELASTICITY
): number {
  if (currentOrders <= 0 || currentPrice <= 0) {
    return 0
  }

  const priceChangeFraction = (newPrice - currentPrice) / currentPrice
  const demandMultiplier = 1 - elasticity * priceChangeFraction
  const projected = Math.round(currentOrders * demandMultiplier)

  return Math.max(0, projected)
}

/**
 * Safely calculates difference and percentage change.
 */
export function calculateImpactDifferences(current: number, projected: number) {
  const difference = Number((projected - current).toFixed(2))
  const differencePercent = calculatePercentageChange(projected, current)
  return { difference, differencePercent }
}
