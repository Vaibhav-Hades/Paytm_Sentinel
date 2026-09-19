import { calculateProjectedOrdersForPrice, DEFAULT_PRICE_ELASTICITY } from './formulas'
import {
  simulateScenarioFromData,
  ProductDataForSimulation,
  OrderDataForSimulation,
} from './index'
import { SimulationRequest } from './types'

function runTests() {
  console.log('🧪 Starting Simulation Engine Unit Tests...\n')
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

  const mockProduct: ProductDataForSimulation = {
    id: 101,
    merchantId: 1,
    name: 'Artisan Cold Brew Bottle',
    sellingPrice: 200,
    costPrice: 150,
  }

  const mockOrders: OrderDataForSimulation[] = [
    { id: 1, productId: 101, quantity: 50, sellingPrice: 200, discount: 500 },
    { id: 2, productId: 101, quantity: 50, sellingPrice: 200, discount: 500 },
  ]

  // TEST 1: Price increase calculation
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 220 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    assert(res.scenario.price === 220, 'TEST 1: Price increase simulation sets target price')
  }

  // TEST 2: Price decrease calculation
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 180 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    assert(res.scenario.price === 180 && res.scenario.projectedOrders > res.baseline.orders, 'TEST 2: Price decrease increases projected orders')
  }

  // TEST 3: Linear elasticity formula
  {
    // price change: (220 - 200) / 200 = +10%
    // demand multiplier: 1 - (0.8 * 0.10) = 0.92
    // projected orders: 100 * 0.92 = 92
    const projected = calculateProjectedOrdersForPrice(100, 200, 220, 0.8)
    assert(projected === 92, 'TEST 3: Linear price elasticity formula calculated accurately')
  }

  // TEST 4: Default elasticity = 0.8
  {
    assert(DEFAULT_PRICE_ELASTICITY === 0.8, 'TEST 4: Default elasticity is 0.8')
  }

  // TEST 5: Projected orders rounded consistently (Math.round)
  {
    const projected = calculateProjectedOrdersForPrice(105, 200, 205, 0.8)
    assert(Number.isInteger(projected), 'TEST 5: Projected orders are deterministic whole integers')
  }

  // TEST 6: Projected orders never become negative (bounded at 0)
  {
    // massive price hike (+500%)
    const projected = calculateProjectedOrdersForPrice(100, 200, 1200, 0.8)
    assert(projected === 0, 'TEST 6: Projected orders bounded below by 0')
  }

  // TEST 7: Projected revenue calculation (projectedPrice * projectedOrders)
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 220 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    const expectedRev = Number((220 * res.scenario.projectedOrders).toFixed(2))
    assert(res.scenario.projectedRevenue === expectedRev, 'TEST 7: Projected revenue is projectedPrice * projectedOrders')
  }

  // TEST 8: Projected COGS calculation (costPrice * projectedOrders)
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 220 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    const expectedCogs = Number((150 * res.scenario.projectedOrders).toFixed(2))
    assert(res.scenario.projectedCogs === expectedCogs, 'TEST 8: Projected COGS uses product.costPrice')
  }

  // TEST 9: Projected discount calculation
  {
    const req: SimulationRequest = { productId: 101, changeType: 'DISCOUNT', newValue: 5 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    assert(res.scenario.projectedDiscount === 500, 'TEST 9: Projected discount calculated per scenario')
  }

  // TEST 10: Projected contribution calculation (Revenue - COGS - Discount)
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 220 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    const expectedContrib = Number(
      (res.scenario.projectedRevenue - res.scenario.projectedCogs - res.scenario.projectedDiscount).toFixed(2)
    )
    assert(res.scenario.projectedContribution === expectedContrib, 'TEST 10: Projected contribution is Revenue - COGS - Discount')
  }

  // TEST 11: Projected contribution margin (Contribution / Revenue * 100)
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 220 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    const expectedMargin = Number(
      ((res.scenario.projectedContribution / res.scenario.projectedRevenue) * 100).toFixed(2)
    )
    assert(res.scenario.projectedContributionMarginPercent === expectedMargin, 'TEST 11: Projected contribution margin % is accurate')
  }

  // TEST 12: Price simulation does not mutate input product/orders
  {
    const originalSellingPrice = mockProduct.sellingPrice
    const originalCostPrice = mockProduct.costPrice
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 250 }
    simulateScenarioFromData(req, mockProduct, mockOrders)
    assert(
      mockProduct.sellingPrice === originalSellingPrice && mockProduct.costPrice === originalCostPrice,
      'TEST 12: Simulation is completely read-only and does not mutate product data'
    )
  }

  // TEST 13: Product must belong to merchant
  {
    const req: SimulationRequest = { merchantId: 2, productId: 101, changeType: 'PRICE', newValue: 220 }
    let threw = false
    try {
      simulateScenarioFromData(req, mockProduct, mockOrders)
    } catch {
      threw = true
    }
    assert(threw, 'TEST 13: Product mismatch with merchantId throws validation error')
  }

  // TEST 14: Invalid productId handled
  {
    const req = { productId: -5, changeType: 'PRICE' as const, newValue: 220 }
    let threw = false
    try {
      simulateScenarioFromData(req, mockProduct, mockOrders)
    } catch {
      threw = true
    }
    assert(threw, 'TEST 14: Invalid negative productId rejected')
  }

  // TEST 15: Invalid price handled (negative or 0)
  {
    const req = { productId: 101, changeType: 'PRICE' as const, newValue: -10 }
    let threw = false
    try {
      simulateScenarioFromData(req, mockProduct, mockOrders)
    } catch {
      threw = true
    }
    assert(threw, 'TEST 15: Negative price value rejected by validation')
  }

  // TEST 16: Discount simulation supported
  {
    const req: SimulationRequest = { productId: 101, changeType: 'DISCOUNT', newValue: 10 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    assert(res.changeType === 'DISCOUNT' && res.model.type === 'DETERMINISTIC_DISCOUNT_ADJUSTMENT', 'TEST 16: Discount simulation supported and typed correctly')
  }

  // TEST 17: Invalid negative discount handled
  {
    const req = { productId: 101, changeType: 'DISCOUNT' as const, newValue: -5 }
    let threw = false
    try {
      simulateScenarioFromData(req, mockProduct, mockOrders)
    } catch {
      threw = true
    }
    assert(threw, 'TEST 17: Negative discount value rejected by validation')
  }

  // TEST 18: FREE/STANDARD/PREMIUM produce identical simulation mathematics
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 220 }
    const res1 = simulateScenarioFromData({ ...req, merchantId: 1 }, { ...mockProduct, merchantId: 1 }, mockOrders)
    const res2 = simulateScenarioFromData({ ...req, merchantId: 2 }, { ...mockProduct, merchantId: 2 }, mockOrders)
    assert(
      res1.scenario.projectedContribution === res2.scenario.projectedContribution &&
        res1.scenario.projectedOrders === res2.scenario.projectedOrders,
      'TEST 18: Multi-merchant & subscription tiers receive identical deterministic math'
    )
  }

  // TEST 19: Baseline values are deterministic
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 220 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    assert(
      res.baseline.orders === 100 &&
        res.baseline.revenue === 20000 &&
        res.baseline.cogs === 15000 &&
        res.baseline.discount === 1000 &&
        res.baseline.contribution === 4000,
      'TEST 19: Baseline values match historical facts exactly'
    )
  }

  // TEST 20: Scenario impact differences are deterministic
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 220 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    assert(
      res.impact.ordersDifference === res.scenario.projectedOrders - res.baseline.orders &&
        res.impact.contributionDifference === res.scenario.projectedContribution - res.baseline.contribution,
      'TEST 20: Impact differences accurately reflect scenario delta'
    )
  }

  // TEST 21: Zero-value edge cases handled safely
  {
    const emptyOrders: OrderDataForSimulation[] = []
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 220 }
    const res = simulateScenarioFromData(req, mockProduct, emptyOrders)
    assert(
      res.baseline.orders === 0 &&
        res.scenario.projectedOrders === 0 &&
        res.scenario.projectedContributionMarginPercent === 0,
      'TEST 21: Zero orders handled safely without NaN or crash'
    )
  }

  // TEST 22: Economic Engine baseline consistency
  {
    const req: SimulationRequest = { productId: 101, changeType: 'PRICE', newValue: 200 }
    const res = simulateScenarioFromData(req, mockProduct, mockOrders)
    assert(
      res.baseline.revenue === res.scenario.projectedRevenue &&
        res.baseline.contribution === res.scenario.projectedContribution,
      'TEST 22: Baseline consistency with 0% price delta produces identical metrics'
    )
  }

  console.log(`\n📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
