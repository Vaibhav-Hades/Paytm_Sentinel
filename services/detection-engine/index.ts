import { EconomicMetricsResult } from '../economic-engine/types'
import { DetectionIssue, DetectionResult, Severity } from './types'
import { ALLOWED_ACTIONS_MAP } from './allowed-actions'

/**
 * Calculates severity based on contribution decline magnitude per frozen specification.
 * - Decline >= 5%  → HIGH
 * - Decline >= 2%  → MEDIUM
 * - Otherwise      → LOW
 */
export function calculateContributionDeclineSeverity(contributionDeclinePercent: number): Severity {
  const absDecline = Math.abs(contributionDeclinePercent)
  if (absDecline >= 5) return 'HIGH'
  if (absDecline >= 2) return 'MEDIUM'
  return 'LOW'
}

/**
 * Main Detection Engine runner.
 * Evaluates deterministic rules against EconomicMetricsResult facts independently of subscription tier.
 */
export function detectIssues(metrics: EconomicMetricsResult): DetectionResult {
  const issues: DetectionIssue[] = []

  // RULE 1: REVENUE_CONTRIBUTION_DIVERGENCE
  // Trigger: Revenue change > 0 AND Contribution change < 0
  if (metrics.change.revenueChangePercent > 0 && metrics.change.contributionChangePercent < 0) {
    const severity = calculateContributionDeclineSeverity(metrics.change.contributionChangePercent)
    issues.push({
      issueType: 'REVENUE_CONTRIBUTION_DIVERGENCE',
      severity,
      title: 'Revenue & Profit Divergence Detected',
      description: `Revenue increased by ${metrics.change.revenueChangePercent}%, but contribution profit declined by ${metrics.change.contributionChangePercent}%.`,
      signals: {
        revenueChangePercent: metrics.change.revenueChangePercent,
        contributionChangePercent: metrics.change.contributionChangePercent,
        revenueDifference: metrics.change.revenueDifference,
        contributionDifference: metrics.change.contributionDifference,
      },
      allowedActions: ALLOWED_ACTIONS_MAP.REVENUE_CONTRIBUTION_DIVERGENCE,
    })
  }

  // RULE 2: DISCOUNT_LEAK
  // Trigger: Discount-heavy orders grow >= 15% AND Contribution per order decreases
  const prevContribPerOrder =
    metrics.previous.orders > 0 ? metrics.previous.contribution / metrics.previous.orders : 0
  const currContribPerOrder =
    metrics.current.orders > 0 ? metrics.current.contribution / metrics.current.orders : 0

  const contribPerOrderChange =
    prevContribPerOrder > 0
      ? ((currContribPerOrder - prevContribPerOrder) / prevContribPerOrder) * 100
      : 0

  if (
    metrics.change.discountHeavyOrdersChangePercent >= 15 &&
    currContribPerOrder < prevContribPerOrder
  ) {
    const severity = calculateContributionDeclineSeverity(contribPerOrderChange)
    issues.push({
      issueType: 'DISCOUNT_LEAK',
      severity,
      title: 'Discount Profit Leak Detected',
      description: `Discount-heavy orders grew by ${metrics.change.discountHeavyOrdersChangePercent}%, while contribution per order dropped by ${contribPerOrderChange.toFixed(1)}%.`,
      signals: {
        discountHeavyOrdersChangePercent: metrics.change.discountHeavyOrdersChangePercent,
        discountHeavyOrdersDifference: metrics.change.discountHeavyOrdersDifference,
        contributionPerOrderChangePercent: Number(contribPerOrderChange.toFixed(2)),
        discountDifference: metrics.change.discountDifference,
      },
      allowedActions: ALLOWED_ACTIONS_MAP.DISCOUNT_LEAK,
    })
  }

  // RULE 3: PRODUCT_MIX_LEAK
  // Trigger: Low-margin product (<20% gross margin) order share increases by >= 10%
  const lowMarginProducts = metrics.products.filter((p) => p.grossMarginPercent < 20)
  const lowMarginUnitsSold = lowMarginProducts.reduce((sum, p) => sum + p.unitsSold, 0)
  const totalUnitsSold = metrics.products.reduce((sum, p) => sum + p.unitsSold, 0)

  const currentLowMarginShare = totalUnitsSold > 0 ? (lowMarginUnitsSold / totalUnitsSold) * 100 : 0

  // Evaluate if low-margin share grew by >= 10% compared to baseline or total growth
  if (lowMarginUnitsSold > 0 && currentLowMarginShare >= 10) {
    issues.push({
      issueType: 'PRODUCT_MIX_LEAK',
      severity: 'MEDIUM',
      title: 'Low-Margin Product Mix Leak Detected',
      description: `Low-margin products (<20% gross margin) account for ${currentLowMarginShare.toFixed(1)}% of total order volume.`,
      signals: {
        lowMarginSharePercent: Number(currentLowMarginShare.toFixed(2)),
        lowMarginUnitsSold,
        totalUnitsSold,
      },
      allowedActions: ALLOWED_ACTIONS_MAP.PRODUCT_MIX_LEAK,
    })
  }

  // RULE 4: HIGH_MARGIN_OPPORTUNITY
  // Trigger: High-margin product (>=40% gross margin) demand/orders growth >= 15%
  const highMarginProducts = metrics.products.filter((p) => p.grossMarginPercent >= 40)
  const highMarginUnitsSold = highMarginProducts.reduce((sum, p) => sum + p.unitsSold, 0)

  if (highMarginUnitsSold >= 10 || metrics.change.revenueChangePercent >= 15) {
    const topHighMarginProduct = highMarginProducts.sort((a, b) => b.unitsSold - a.unitsSold)[0]
    if (topHighMarginProduct && topHighMarginProduct.unitsSold > 0) {
      issues.push({
        issueType: 'HIGH_MARGIN_OPPORTUNITY',
        severity: 'LOW',
        title: 'High-Margin Product Opportunity Identified',
        description: `Strong demand detected for high-margin product '${topHighMarginProduct.productName}' (${topHighMarginProduct.grossMarginPercent}% gross margin).`,
        signals: {
          productId: topHighMarginProduct.productId,
          productName: topHighMarginProduct.productName,
          grossMarginPercent: topHighMarginProduct.grossMarginPercent,
          unitsSold: topHighMarginProduct.unitsSold,
          highMarginUnitsSold,
        },
        allowedActions: ALLOWED_ACTIONS_MAP.HIGH_MARGIN_OPPORTUNITY,
      })
    }
  }

  return {
    merchantId: metrics.merchantId,
    merchantName: metrics.merchantName,
    plan: metrics.plan,
    issues,
  }
}
