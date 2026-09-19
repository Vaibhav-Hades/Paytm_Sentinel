import { calculatePercentageChange } from '../economic-engine/formulas'
import {
  ExperimentResultDTO,
  ExperimentStatus,
  OrderDataForExperiment,
  PublicExperimentResultDTO,
} from './types'

export interface PeriodEconomics {
  ordersCount: number
  revenue: number
  cogs: number
  discount: number
  contribution: number
}

/**
 * Deterministically computes economic performance for a given set of orders.
 */
export function calculatePeriodEconomics(
  orders: OrderDataForExperiment[],
  costPrice: number
): PeriodEconomics {
  let totalRevenue = 0
  let totalCogs = 0
  let totalDiscount = 0
  let totalUnits = 0

  orders.forEach((o) => {
    const qty = o.quantity
    totalRevenue += o.sellingPrice * qty
    totalCogs += costPrice * qty
    totalDiscount += o.discount
    totalUnits += qty
  })

  totalRevenue = Number(totalRevenue.toFixed(2))
  totalCogs = Number(totalCogs.toFixed(2))
  totalDiscount = Number(totalDiscount.toFixed(2))
  const contribution = Number((totalRevenue - totalCogs - totalDiscount).toFixed(2))

  return {
    ordersCount: totalUnits,
    revenue: totalRevenue,
    cogs: totalCogs,
    discount: totalDiscount,
    contribution,
  }
}

/**
 * Builds the canonical 8-field internal ExperimentResultDTO.
 * Guaranteed to handle 0 denominators safely without NaN or Infinity.
 */
export function buildCanonicalExperimentResult(
  baselineContribution: number,
  experimentContribution: number,
  baselineOrders: number,
  experimentOrders: number
): ExperimentResultDTO {
  const contributionDifference = Number((experimentContribution - baselineContribution).toFixed(2))
  const contributionChangePercent = calculatePercentageChange(
    experimentContribution,
    baselineContribution
  )

  const orderDifference = experimentOrders - baselineOrders
  const orderChangePercent = calculatePercentageChange(experimentOrders, baselineOrders)

  return {
    baselineContribution: Number(baselineContribution.toFixed(2)),
    experimentContribution: Number(experimentContribution.toFixed(2)),
    baselineOrders,
    experimentOrders,
    contributionDifference,
    contributionChangePercent,
    orderDifference,
    orderChangePercent,
  }
}

/**
 * Maps the internal canonical ExperimentResultDTO to the nested public REST response shape.
 */
export function mapToPublicExperimentResult(dto: ExperimentResultDTO): PublicExperimentResultDTO {
  return {
    baseline: {
      contribution: dto.baselineContribution,
      orders: dto.baselineOrders,
    },
    result: {
      contribution: dto.experimentContribution,
      orders: dto.experimentOrders,
    },
    impact: {
      contributionDifference: dto.contributionDifference,
      contributionChangePercent: dto.contributionChangePercent,
      orderDifference: dto.orderDifference,
      orderChangePercent: dto.orderChangePercent,
    },
  }
}

/**
 * Validates permitted experiment status lifecycle transitions.
 * Permitted transitions:
 *   DRAFT -> RUNNING
 *   RUNNING -> COMPLETED
 *   DRAFT -> CANCELLED
 *   RUNNING -> CANCELLED
 * Rejects all invalid transitions.
 */
export function validateExperimentTransition(
  currentStatus: ExperimentStatus,
  targetStatus: ExperimentStatus
): void {
  if (currentStatus === targetStatus) {
    throw new Error(
      `Invalid experiment transition: Experiment is already in status '${currentStatus}'.`
    )
  }

  const validTransitions: Record<ExperimentStatus, ExperimentStatus[]> = {
    [ExperimentStatus.DRAFT]: [ExperimentStatus.RUNNING, ExperimentStatus.CANCELLED],
    [ExperimentStatus.RUNNING]: [ExperimentStatus.COMPLETED, ExperimentStatus.CANCELLED],
    [ExperimentStatus.COMPLETED]: [],
    [ExperimentStatus.CANCELLED]: [],
  }

  const allowed = validTransitions[currentStatus] || []
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Invalid experiment transition: Cannot transition from '${currentStatus}' to '${targetStatus}'.`
    )
  }
}
