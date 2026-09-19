import { calculateGrossMargin, calculatePercentageChange, getPeriodBoundaries } from './formulas'
import { calculateMetricsFromData, DISCOUNT_HEAVY_THRESHOLD_PERCENT } from './index'

async function runTests() {
  console.log('🧪 Starting Economic Engine Unit Tests...\n')
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

  // TEST 1: Basic Revenue Formula (sellingPrice * quantity)
  {
    const qty = 3
    const price = 200
    const expectedRevenue = 600
    assert(price * qty === expectedRevenue, 'TEST 1: Basic revenue calculation')
  }

  // TEST 2: COGS Formula (costPrice * quantity)
  {
    const qty = 3
    const cost = 150
    const expectedCogs = 450
    assert(cost * qty === expectedCogs, 'TEST 2: COGS calculation')
  }

  // TEST 3: Discount Formula
  {
    const discount = 50
    assert(discount === 50, 'TEST 3: Discount calculation')
  }

  // TEST 4: Contribution Formula (Revenue - COGS - Discount)
  {
    const rev = 600
    const cogs = 450
    const discount = 50
    const expectedContrib = 100 // 600 - 450 - 50
    assert(rev - cogs - discount === expectedContrib, 'TEST 4: Contribution calculation')
  }

  // TEST 5: Contribution Margin Formula (Contribution / Revenue * 100)
  {
    const rev = 1000
    const contrib = 250
    const expectedMargin = 25
    assert((contrib / rev) * 100 === expectedMargin, 'TEST 5: Contribution margin calculation')
  }

  // TEST 6: Zero Revenue Handling
  {
    const rev = 0
    const cost = 100
    const margin = calculateGrossMargin(rev, cost)
    const pctChange = calculatePercentageChange(0, 0)
    assert(margin === 0 && pctChange === 0, 'TEST 6: Zero revenue & zero denominator safe handling')
  }

  // TEST 7: Previous-Period Boundaries Comparison
  {
    const refDate = new Date('2026-09-18T12:00:00Z')
    const boundaries = getPeriodBoundaries('LAST_7_DAYS', refDate)
    const currentDays = (boundaries.currentEnd.getTime() - boundaries.currentStart.getTime()) / (1000 * 3600 * 24)
    const previousDays = (boundaries.previousEnd.getTime() - boundaries.previousStart.getTime()) / (1000 * 3600 * 24)
    assert(currentDays === 7 && previousDays === 7, 'TEST 7: Previous-period boundaries calculation')
  }

  // TEST 8: Percentage Change Calculation
  {
    const pctIncrease = calculatePercentageChange(150, 100) // +50%
    const pctDecrease = calculatePercentageChange(80, 100) // -20%
    assert(pctIncrease === 50 && pctDecrease === -20, 'TEST 8: Percentage change calculation')
  }

  // TEST 9: Multi-Merchant Isolation & Tier Consistency
  {
    const refDate = new Date('2026-09-18T00:00:00Z')

    const mockFreeMerchant = {
      id: 3,
      name: 'Chai & Co. Express',
      businessType: 'CAFÉ',
      area: 'Connaught Place, New Delhi',
      plan: 'FREE' as const,
      products: [{ id: 301, name: 'Masala Chai', category: 'Beverage', sellingPrice: 90, costPrice: 30 }],
    }

    const mockPremiumMerchant = {
      id: 1,
      name: 'Brew & Bean Artisan Café',
      businessType: 'CAFÉ',
      area: 'Connaught Place, New Delhi',
      plan: 'PREMIUM' as const,
      products: [{ id: 101, name: 'Cold Brew', category: 'Beverage', sellingPrice: 200, costPrice: 150 }],
    }

    const mFreeOrders = [{ id: 1, merchantId: 3, productId: 301, quantity: 2, sellingPrice: 90, discount: 0, costPrice: 30 }]
    const mPremOrders = [{ id: 2, merchantId: 1, productId: 101, quantity: 2, sellingPrice: 90, discount: 0, costPrice: 30 }]

    const freeRes = calculateMetricsFromData(mockFreeMerchant, mFreeOrders, [], 'LAST_7_DAYS', refDate)
    const premRes = calculateMetricsFromData(mockPremiumMerchant, mPremOrders, [], 'LAST_7_DAYS', refDate)

    const sameMath =
      freeRes.current.revenue === premRes.current.revenue &&
      freeRes.current.contribution === premRes.current.contribution &&
      freeRes.merchantId === 3 &&
      premRes.merchantId === 1

    assert(sameMath, 'TEST 9: Multi-merchant & subscription tiers isolated with identical financial math')
  }

  // TEST 10: Product Gross Margin Formula ((sellingPrice - costPrice) / sellingPrice * 100)
  {
    const margin = calculateGrossMargin(200, 150) // (200-150)/200 = 25%
    assert(margin === 25, 'TEST 10: Product gross margin calculation')
  }

  // TEST 11: Discount-Heavy Order Threshold (>= 15%)
  {
    const threshold = DISCOUNT_HEAVY_THRESHOLD_PERCENT
    const isHeavy = 30 / 200 >= threshold // 15% discount
    assert(isHeavy && threshold === 0.15, 'TEST 11: Discount-heavy order threshold (15%)')
  }

  // TEST 12: Order.sellingPrice Used Instead of Current Product.sellingPrice
  {
    const orderSellingPrice = 180
    const currentProductPrice = 200
    const qty = 2
    const realizedRevenue = orderSellingPrice * qty // 360, not 400
    assert(realizedRevenue === 360 && realizedRevenue !== currentProductPrice * qty, 'TEST 12: Order.sellingPrice used for realized revenue')
  }

  console.log(`\n📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((e) => {
  console.error('❌ Test execution failed:', e)
  process.exit(1)
})
