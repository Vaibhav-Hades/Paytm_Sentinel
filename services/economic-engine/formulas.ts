import { AnalysisPeriod } from './types'

export interface PeriodBoundaries {
  currentStart: Date
  currentEnd: Date
  previousStart: Date
  previousEnd: Date
}

/**
 * Calculates deterministic start and end dates for current and previous analysis periods
 * given a reference date (defaults to current system date).
 */
export function getPeriodBoundaries(period: AnalysisPeriod, referenceDate: Date = new Date()): PeriodBoundaries {
  const currentEnd = new Date(referenceDate)
  const days = period === 'LAST_7_DAYS' ? 7 : 30

  // Current period: [referenceDate - days, referenceDate]
  const currentStart = new Date(referenceDate)
  currentStart.setDate(currentStart.getDate() - days)

  // Previous period: [currentStart - days, currentStart]
  const previousEnd = new Date(currentStart)
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - days)

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  }
}

/**
 * Safely calculates percentage change from previous to current value.
 * Returns 0 if previous value is zero to avoid NaN/Infinity.
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100 // Safe deterministic fallback for zero denominator
  }
  const change = ((current - previous) / previous) * 100
  return Number(change.toFixed(2))
}

/**
 * Safely calculates gross margin percentage: (sellingPrice - costPrice) / sellingPrice * 100
 */
export function calculateGrossMargin(sellingPrice: number, costPrice: number): number {
  if (sellingPrice <= 0) return 0
  const margin = ((sellingPrice - costPrice) / sellingPrice) * 100
  return Number(margin.toFixed(2))
}
