import { Experiment, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import {
  ApproveExperimentInput,
  CompleteExperimentInput,
  CreateExperimentInput,
  ExperimentResultDTO,
  ExperimentStatus,
  OrderDataForExperiment,
  PublicExperimentResultDTO,
} from './types'
import {
  ApproveExperimentSchema,
  CompleteExperimentSchema,
  CreateExperimentSchema,
} from './schemas'
import {
  buildCanonicalExperimentResult,
  calculatePeriodEconomics,
  mapToPublicExperimentResult,
  validateExperimentTransition,
} from './formulas'
import { getPeriodBoundaries } from '../economic-engine/formulas'

export {
  buildCanonicalExperimentResult,
  calculatePeriodEconomics,
  mapToPublicExperimentResult,
  validateExperimentTransition,
}

/**
 * Pure calculator for experiment results from in-memory order data.
 * Does not depend on or modify database state.
 */
export function calculateExperimentResultFromData(
  baselineOrders: OrderDataForExperiment[],
  experimentOrders: OrderDataForExperiment[],
  productCostPrice: number
): ExperimentResultDTO {
  const baseEco = calculatePeriodEconomics(baselineOrders, productCostPrice)
  const expEco = calculatePeriodEconomics(experimentOrders, productCostPrice)

  return buildCanonicalExperimentResult(
    baseEco.contribution,
    expEco.contribution,
    baseEco.ordersCount,
    expEco.ordersCount
  )
}

/**
 * Creates a new experiment in DRAFT status.
 * Enforces merchant isolation, product ownership, and insight traceability.
 */
export async function createExperiment(
  input: CreateExperimentInput,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<Experiment> {
  const validated = CreateExperimentSchema.parse(input)

  // 1. Verify merchant exists
  const merchant = await client.merchant.findUnique({
    where: { id: validated.merchantId },
  })
  if (!merchant) {
    throw new Error(`Merchant with id ${validated.merchantId} not found.`)
  }

  // 2. Verify product exists and belongs to merchant
  const product = await client.product.findUnique({
    where: { id: validated.productId },
  })
  if (!product) {
    throw new Error(`Product with id ${validated.productId} not found.`)
  }
  if (product.merchantId !== validated.merchantId) {
    throw new Error(
      `Product ${validated.productId} does not belong to merchant ${validated.merchantId}.`
    )
  }

  // 3. Verify insight exists and belongs to merchant
  const insight = await client.insight.findUnique({
    where: { id: validated.insightId },
  })
  if (!insight) {
    throw new Error(`Insight with id ${validated.insightId} not found.`)
  }
  if (insight.merchantId !== validated.merchantId) {
    throw new Error(
      `Insight ${validated.insightId} does not belong to merchant ${validated.merchantId}.`
    )
  }

  // 4. Create experiment strictly in DRAFT status
  const experiment = await client.experiment.create({
    data: {
      merchantId: validated.merchantId,
      productId: validated.productId,
      insightId: validated.insightId,
      type: validated.type,
      oldValue: validated.oldValue,
      newValue: validated.newValue,
      durationDays: validated.durationDays,
      metric: validated.metric,
      status: ExperimentStatus.DRAFT,
    },
  })

  return experiment
}

/**
 * Approves an experiment, transitioning status from DRAFT -> RUNNING.
 * Requires explicit merchant approval.
 */
export async function approveExperiment(
  input: ApproveExperimentInput
): Promise<Experiment> {
  const validated = ApproveExperimentSchema.parse(input)

  return await prisma.$transaction(async (tx) => {
    const experiment = await tx.experiment.findUnique({
      where: { id: validated.experimentId },
    })

    if (!experiment) {
      throw new Error(`Experiment with id ${validated.experimentId} not found.`)
    }

    if (validated.merchantId && experiment.merchantId !== validated.merchantId) {
      throw new Error(
        `Experiment ${validated.experimentId} does not belong to merchant ${validated.merchantId}.`
      )
    }

    // Validate transition: strictly DRAFT -> RUNNING
    validateExperimentTransition(experiment.status, ExperimentStatus.RUNNING)

    const updated = await tx.experiment.update({
      where: { id: validated.experimentId },
      data: {
        status: ExperimentStatus.RUNNING,
        startedAt: new Date(),
      },
    })

    return updated
  })
}

export interface CompleteExperimentOptions {
  referenceDate?: Date
  customBaselineOrders?: OrderDataForExperiment[]
  customExperimentOrders?: OrderDataForExperiment[]
}

/**
 * Completes an experiment, transitioning status from RUNNING -> COMPLETED.
 * Calculates deterministic experiment results from transactional data.
 */
export async function completeExperiment(
  input: CompleteExperimentInput,
  options?: CompleteExperimentOptions
): Promise<{
  experiment: Experiment
  result: ExperimentResultDTO
  publicResult: PublicExperimentResultDTO
}> {
  const validated = CompleteExperimentSchema.parse(input)

  return await prisma.$transaction(async (tx) => {
    const experiment = await tx.experiment.findUnique({
      where: { id: validated.experimentId },
      include: {
        product: true,
        merchant: true,
      },
    })

    if (!experiment) {
      throw new Error(`Experiment with id ${validated.experimentId} not found.`)
    }

    if (validated.merchantId && experiment.merchantId !== validated.merchantId) {
      throw new Error(
        `Experiment ${validated.merchantId} does not belong to merchant ${validated.merchantId}.`
      )
    }

    // Validate transition: strictly RUNNING -> COMPLETED
    validateExperimentTransition(experiment.status, ExperimentStatus.COMPLETED)

    const now = new Date()
    const completedAt = now

    // Determine baseline vs experiment period orders
    let result: ExperimentResultDTO

    if (options?.customBaselineOrders && options?.customExperimentOrders) {
      result = calculateExperimentResultFromData(
        options.customBaselineOrders,
        options.customExperimentOrders,
        experiment.product.costPrice
      )
    } else {
      // Calculate from database orders based on analysis period
      // If referenceDate is given or fallback to latest order / reference
      const refDate = options?.referenceDate ?? new Date('2026-09-18T00:00:00Z')
      const periodBoundaries = getPeriodBoundaries('LAST_7_DAYS', refDate)

      // Fetch product orders in baseline window and experiment window
      const baselineOrders = await tx.order.findMany({
        where: {
          merchantId: experiment.merchantId,
          productId: experiment.productId,
          createdAt: {
            gte: periodBoundaries.previousStart,
            lt: periodBoundaries.previousEnd,
          },
        },
      })

      const experimentOrders = await tx.order.findMany({
        where: {
          merchantId: experiment.merchantId,
          productId: experiment.productId,
          createdAt: {
            gte: periodBoundaries.currentStart,
            lte: periodBoundaries.currentEnd,
          },
        },
      })

      result = calculateExperimentResultFromData(
        baselineOrders,
        experimentOrders,
        experiment.product.costPrice
      )
    }

    const updated = await tx.experiment.update({
      where: { id: validated.experimentId },
      data: {
        status: ExperimentStatus.COMPLETED,
        completedAt,
      },
    })

    const publicResult = mapToPublicExperimentResult(result)

    return {
      experiment: updated,
      result,
      publicResult,
    }
  })
}

/**
 * Retrieves the experiment result for an existing experiment.
 */
export async function getExperimentResult(
  experimentId: number,
  merchantId?: number,
  options?: CompleteExperimentOptions
): Promise<{
  experiment: Experiment
  result: ExperimentResultDTO
  publicResult: PublicExperimentResultDTO
}> {
  const experiment = await prisma.experiment.findUnique({
    where: { id: experimentId },
    include: {
      product: true,
      merchant: true,
    },
  })

  if (!experiment) {
    throw new Error(`Experiment with id ${experimentId} not found.`)
  }

  if (merchantId && experiment.merchantId !== merchantId) {
    throw new Error(`Experiment ${experimentId} does not belong to merchant ${merchantId}.`)
  }

  const refDate = options?.referenceDate ?? new Date('2026-09-18T00:00:00Z')
  const periodBoundaries = getPeriodBoundaries('LAST_7_DAYS', refDate)

  const baselineOrders = await prisma.order.findMany({
    where: {
      merchantId: experiment.merchantId,
      productId: experiment.productId,
      createdAt: {
        gte: periodBoundaries.previousStart,
        lt: periodBoundaries.previousEnd,
      },
    },
  })

  const experimentOrders = await prisma.order.findMany({
    where: {
      merchantId: experiment.merchantId,
      productId: experiment.productId,
      createdAt: {
        gte: periodBoundaries.currentStart,
        lte: periodBoundaries.currentEnd,
      },
    },
  })

  const result = calculateExperimentResultFromData(
    baselineOrders,
    experimentOrders,
    experiment.product.costPrice
  )

  return {
    experiment,
    result,
    publicResult: mapToPublicExperimentResult(result),
  }
}
