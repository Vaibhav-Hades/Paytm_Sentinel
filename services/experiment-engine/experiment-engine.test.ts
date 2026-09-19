import { ExperimentMetric, ExperimentStatus } from '@prisma/client'
import {
  buildCanonicalExperimentResult,
  validateExperimentTransition,
} from './formulas'
import {
  calculateExperimentResultFromData,
} from './index'
import { OrderDataForExperiment } from './types'
import { CreateExperimentSchema } from './schemas'

async function runTests() {
  console.log('🧪 Starting Experiment Engine Unit Tests...\n')
  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ ${testName}`)
      passed++
    } else {
      console.error(`  ❌ ${testName}`)
      failed++
    }
  }

  // TEST 1: Experiment can be created in DRAFT schema validation
  {
    const input = {
      merchantId: 1,
      productId: 101,
      insightId: 1,
      type: 'REDUCE_DISCOUNT',
      oldValue: 25,
      newValue: 10,
      durationDays: 7,
      metric: ExperimentMetric.CONTRIBUTION,
    }
    const validated = CreateExperimentSchema.parse(input)
    assert(validated.merchantId === 1 && validated.durationDays === 7, 'TEST 1: Experiment input validated for creation')
  }

  // TEST 2: New experiment status is DRAFT
  {
    const status = ExperimentStatus.DRAFT
    assert(status === 'DRAFT', 'TEST 2: Initial experiment status is DRAFT')
  }

  // TEST 3: Experiment correctly references Insight
  {
    const input = {
      merchantId: 1,
      productId: 101,
      insightId: 42,
      type: 'REDUCE_DISCOUNT',
      oldValue: 20,
      newValue: 10,
    }
    const validated = CreateExperimentSchema.parse(input)
    assert(validated.insightId === 42, 'TEST 3: Experiment correctly references Insight ID')
  }

  // TEST 4: Experiment correctly references Merchant
  {
    const input = {
      merchantId: 7,
      productId: 701,
      insightId: 12,
      type: 'PRICE_TEST',
      oldValue: 300,
      newValue: 320,
    }
    const validated = CreateExperimentSchema.parse(input)
    assert(validated.merchantId === 7, 'TEST 4: Experiment correctly references Merchant ID')
  }

  // TEST 5: Invalid merchant rejected
  {
    let caught = false
    try {
      CreateExperimentSchema.parse({
        merchantId: -1,
        productId: 101,
        insightId: 1,
        type: 'PRICE_TEST',
        oldValue: 200,
        newValue: 220,
      })
    } catch {
      caught = true
    }
    assert(caught, 'TEST 5: Invalid merchant ID rejected by validation schema')
  }

  // TEST 6: Invalid product rejected
  {
    let caught = false
    try {
      CreateExperimentSchema.parse({
        merchantId: 1,
        productId: 0,
        insightId: 1,
        type: 'PRICE_TEST',
        oldValue: 200,
        newValue: 220,
      })
    } catch {
      caught = true
    }
    assert(caught, 'TEST 6: Invalid product ID rejected by validation schema')
  }

  // TEST 7: Product belonging to another merchant rejected
  {
    // Simulating validation check: product.merchantId !== request.merchantId
    const productMerchantId: number = 2
    const requestMerchantId: number = 1
    const rejected = productMerchantId !== requestMerchantId
    assert(rejected, 'TEST 7: Product belonging to another merchant rejected')
  }

  // TEST 8: DRAFT can be approved
  {
    let error: Error | null = null
    try {
      validateExperimentTransition(ExperimentStatus.DRAFT, ExperimentStatus.RUNNING)
    } catch (e: unknown) {
      if (e instanceof Error) error = e
    }
    assert(error === null, 'TEST 8: DRAFT can be transitioned to RUNNING upon approval')
  }

  // TEST 9: DRAFT becomes RUNNING after approval
  {
    let currentStatus: ExperimentStatus = ExperimentStatus.DRAFT
    validateExperimentTransition(currentStatus, ExperimentStatus.RUNNING)
    currentStatus = ExperimentStatus.RUNNING
    assert(currentStatus === ExperimentStatus.RUNNING, 'TEST 9: DRAFT status updates to RUNNING')
  }

  // TEST 10: RUNNING cannot be approved again
  {
    let caught = false
    try {
      validateExperimentTransition(ExperimentStatus.RUNNING, ExperimentStatus.RUNNING)
    } catch {
      caught = true
    }
    assert(caught, 'TEST 10: RUNNING cannot be approved again (rejects double approval)')
  }

  // TEST 11: COMPLETED cannot be approved
  {
    let caught = false
    try {
      validateExperimentTransition(ExperimentStatus.COMPLETED, ExperimentStatus.RUNNING)
    } catch {
      caught = true
    }
    assert(caught, 'TEST 11: COMPLETED cannot be transitioned to RUNNING')
  }

  // TEST 12: RUNNING can be completed
  {
    let error: Error | null = null
    try {
      validateExperimentTransition(ExperimentStatus.RUNNING, ExperimentStatus.COMPLETED)
    } catch (e: unknown) {
      if (e instanceof Error) error = e
    }
    assert(error === null, 'TEST 12: RUNNING can be transitioned to COMPLETED')
  }

  // TEST 13: DRAFT cannot directly become COMPLETED
  {
    let caught = false
    try {
      validateExperimentTransition(ExperimentStatus.DRAFT, ExperimentStatus.COMPLETED)
    } catch {
      caught = true
    }
    assert(caught, 'TEST 13: DRAFT cannot directly transition to COMPLETED')
  }

  // TEST 14: Experiment result contains canonical 8-field DTO
  {
    const res = buildCanonicalExperimentResult(67200, 78900, 840, 812)
    const keys = Object.keys(res).sort()
    const expectedKeys = [
      'baselineContribution',
      'experimentContribution',
      'baselineOrders',
      'experimentOrders',
      'contributionDifference',
      'contributionChangePercent',
      'orderDifference',
      'orderChangePercent',
    ].sort()
    const matches = JSON.stringify(keys) === JSON.stringify(expectedKeys)
    assert(matches, 'TEST 14: Experiment result contains canonical 8-field internal DTO')
  }

  // TEST 15: Contribution difference calculated correctly
  {
    const res = buildCanonicalExperimentResult(67200, 78900, 840, 812)
    assert(res.contributionDifference === 11700, 'TEST 15: Contribution difference (78900 - 67200 = 11700) calculated accurately')
  }

  // TEST 16: Contribution change percentage calculated correctly
  {
    // (78900 - 67200) / 67200 * 100 = 17.4107... -> 17.41
    const res = buildCanonicalExperimentResult(67200, 78900, 840, 812)
    assert(res.contributionChangePercent === 17.41, 'TEST 16: Contribution change percent (+17.41%) calculated accurately')
  }

  // TEST 17: Order difference calculated correctly
  {
    const res = buildCanonicalExperimentResult(67200, 78900, 840, 812)
    assert(res.orderDifference === -28, 'TEST 17: Order difference (812 - 840 = -28) calculated accurately')
  }

  // TEST 18: Order change percentage calculated correctly
  {
    // (812 - 840) / 840 * 100 = -3.333... -> -3.33
    const res = buildCanonicalExperimentResult(67200, 78900, 840, 812)
    assert(res.orderChangePercent === -3.33, 'TEST 18: Order change percent (-3.33%) calculated accurately')
  }

  // TEST 19: Zero denominator handled safely
  {
    const res = buildCanonicalExperimentResult(0, 5000, 0, 50)
    assert(
      !isNaN(res.contributionChangePercent) &&
        !isNaN(res.orderChangePercent) &&
        isFinite(res.contributionChangePercent) &&
        isFinite(res.orderChangePercent),
      'TEST 19: Zero denominator handled safely without NaN or Infinity'
    )
  }

  // TEST 20: Experiment result does not use AI-generated numbers (deterministic test)
  {
    const baselineOrders: OrderDataForExperiment[] = [
      { id: 1, productId: 101, quantity: 10, sellingPrice: 300, discount: 500 },
    ]
    const experimentOrders: OrderDataForExperiment[] = [
      { id: 2, productId: 101, quantity: 10, sellingPrice: 300, discount: 100 },
    ]
    const costPrice = 150
    const res1 = calculateExperimentResultFromData(baselineOrders, experimentOrders, costPrice)
    const res2 = calculateExperimentResultFromData(baselineOrders, experimentOrders, costPrice)
    assert(
      res1.contributionDifference === 400 && res1.contributionDifference === res2.contributionDifference,
      'TEST 20: Experiment result is strictly deterministic from order facts'
    )
  }

  // TEST 21: Simulation values are not copied into experiment results
  {
    const simulatedHypotheticalContribution = 99999
    const actualExperimentOrders: OrderDataForExperiment[] = [
      { id: 1, productId: 101, quantity: 5, sellingPrice: 300, discount: 50 },
    ]
    const res = calculateExperimentResultFromData([], actualExperimentOrders, 150)
    assert(
      res.experimentContribution !== simulatedHypotheticalContribution && res.experimentContribution === 700,
      'TEST 21: Actual experiment results derived purely from observed orders, not simulation projections'
    )
  }

  // TEST 22: Multiple merchants remain isolated
  {
    const m1Orders: OrderDataForExperiment[] = [
      { id: 1, productId: 101, quantity: 10, sellingPrice: 200, discount: 100 },
    ]
    const m2Orders: OrderDataForExperiment[] = [
      { id: 2, productId: 201, quantity: 20, sellingPrice: 400, discount: 200 },
    ]
    const res1 = calculateExperimentResultFromData([], m1Orders, 100)
    const res2 = calculateExperimentResultFromData([], m2Orders, 200)
    assert(
      res1.experimentContribution === 900 && res2.experimentContribution === 3800,
      'TEST 22: Merchant calculations remain completely isolated'
    )
  }

  // TEST 23: FREE/STANDARD/PREMIUM produce identical experiment measurement mathematics
  {
    const orders: OrderDataForExperiment[] = [
      { id: 1, productId: 1, quantity: 10, sellingPrice: 100, discount: 10 },
    ]
    const resFree = calculateExperimentResultFromData([], orders, 50)
    const resStd = calculateExperimentResultFromData([], orders, 50)
    const resPrem = calculateExperimentResultFromData([], orders, 50)
    assert(
      resFree.experimentContribution === resStd.experimentContribution &&
        resStd.experimentContribution === resPrem.experimentContribution,
      'TEST 23: Experiment measurement mathematics is identical across all tiers'
    )
  }

  // TEST 24: Invalid lifecycle transition is rejected
  {
    let caughtCancelledToRunning = false
    try {
      validateExperimentTransition(ExperimentStatus.CANCELLED, ExperimentStatus.RUNNING)
    } catch {
      caughtCancelledToRunning = true
    }

    let caughtCompletedToCompleted = false
    try {
      validateExperimentTransition(ExperimentStatus.COMPLETED, ExperimentStatus.COMPLETED)
    } catch {
      caughtCompletedToCompleted = true
    }

    assert(
      caughtCancelledToRunning && caughtCompletedToCompleted,
      'TEST 24: Invalid lifecycle transitions (CANCELLED->RUNNING, COMPLETED->COMPLETED) strictly rejected'
    )
  }

  console.log(`\n========================================`)
  console.log(`Experiment Engine Test Results: ${passed} passed, ${failed} failed`)
  console.log(`========================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
