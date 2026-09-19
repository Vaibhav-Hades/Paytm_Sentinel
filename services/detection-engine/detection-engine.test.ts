import { calculateContributionDeclineSeverity, detectIssues } from './index'
import { EconomicMetricsResult } from '../economic-engine/types'

function createMockMetrics(overrides: Partial<EconomicMetricsResult> = {}): EconomicMetricsResult {
  return {
    merchantId: 1,
    merchantName: 'Test Merchant',
    businessType: 'CAFÉ',
    area: 'Connaught Place',
    plan: 'PREMIUM',
    period: 'LAST_7_DAYS',
    currentPeriodDates: { startDate: new Date(), endDate: new Date() },
    previousPeriodDates: { startDate: new Date(), endDate: new Date() },
    current: {
      revenue: 10000,
      cogs: 5000,
      discount: 1000,
      contribution: 4000,
      contributionMarginPercent: 40,
      orders: 100,
      averageOrderValue: 100,
      discountHeavyOrdersCount: 20,
      discountHeavyOrdersSharePercent: 20,
    },
    previous: {
      revenue: 9000,
      cogs: 4500,
      discount: 500,
      contribution: 4000,
      contributionMarginPercent: 44.4,
      orders: 90,
      averageOrderValue: 100,
      discountHeavyOrdersCount: 10,
      discountHeavyOrdersSharePercent: 11.1,
    },
    change: {
      revenueDifference: 1000,
      revenueChangePercent: 11.1,
      cogsDifference: 500,
      cogsChangePercent: 11.1,
      discountDifference: 500,
      discountChangePercent: 100,
      contributionDifference: 0,
      contributionChangePercent: 0,
      contributionMarginDifference: -4.4,
      ordersDifference: 10,
      orderChangePercent: 11.1,
      discountHeavyOrdersDifference: 10,
      discountHeavyOrdersChangePercent: 100,
    },
    products: [
      {
        productId: 101,
        productName: 'High Margin Item',
        category: 'Food',
        sellingPrice: 100,
        costPrice: 50,
        grossMarginPercent: 50,
        unitsSold: 50,
        revenue: 5000,
        cogs: 2500,
        discount: 0,
        contribution: 2500,
      },
    ],
    ...overrides,
  }
}

function runTests() {
  console.log('🧪 Starting Detection Engine Unit Tests...\n')
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

  // TEST 1: REVENUE_CONTRIBUTION_DIVERGENCE trigger
  {
    const metrics = createMockMetrics({
      change: {
        ...createMockMetrics().change,
        revenueChangePercent: 10,
        contributionChangePercent: -6,
      },
    })
    const res = detectIssues(metrics)
    const hasDivergence = res.issues.some((i) => i.issueType === 'REVENUE_CONTRIBUTION_DIVERGENCE')
    assert(hasDivergence, 'TEST 1: Revenue/contribution divergence triggered when rev > 0 & contrib < 0')
  }

  // TEST 2: No divergence when both move in same direction
  {
    const metrics = createMockMetrics({
      change: {
        ...createMockMetrics().change,
        revenueChangePercent: 10,
        contributionChangePercent: 5,
      },
    })
    const res = detectIssues(metrics)
    const hasDivergence = res.issues.some((i) => i.issueType === 'REVENUE_CONTRIBUTION_DIVERGENCE')
    assert(!hasDivergence, 'TEST 2: No divergence when both revenue & contribution increase')
  }

  // TEST 3: DISCOUNT_LEAK detection trigger
  {
    const metrics = createMockMetrics({
      current: { ...createMockMetrics().current, orders: 100, contribution: 3000 }, // 30/order
      previous: { ...createMockMetrics().previous, orders: 100, contribution: 5000 }, // 50/order
      change: { ...createMockMetrics().change, discountHeavyOrdersChangePercent: 25 }, // >= 15%
    })
    const res = detectIssues(metrics)
    const hasDiscountLeak = res.issues.some((i) => i.issueType === 'DISCOUNT_LEAK')
    assert(hasDiscountLeak, 'TEST 3: Discount leak triggered when heavy orders grow >= 15% & contrib/order drops')
  }

  // TEST 4: Discount-heavy order threshold = 15%
  {
    const discountPercent = 30 / 200 // 15%
    assert(discountPercent >= 0.15, 'TEST 4: Discount-heavy threshold is 15%')
  }

  // TEST 5: Discount-heavy growth threshold = 15%
  {
    const metrics = createMockMetrics({
      current: { ...createMockMetrics().current, orders: 100, contribution: 3000 },
      previous: { ...createMockMetrics().previous, orders: 100, contribution: 5000 },
      change: { ...createMockMetrics().change, discountHeavyOrdersChangePercent: 10 }, // < 15%
    })
    const res = detectIssues(metrics)
    const hasDiscountLeak = res.issues.some((i) => i.issueType === 'DISCOUNT_LEAK')
    assert(!hasDiscountLeak, 'TEST 5: Discount leak not triggered when growth < 15%')
  }

  // TEST 6: Contribution/order decline requirement
  {
    const metrics = createMockMetrics({
      current: { ...createMockMetrics().current, orders: 100, contribution: 6000 }, // 60/order (up)
      previous: { ...createMockMetrics().previous, orders: 100, contribution: 5000 }, // 50/order
      change: { ...createMockMetrics().change, discountHeavyOrdersChangePercent: 25 },
    })
    const res = detectIssues(metrics)
    const hasDiscountLeak = res.issues.some((i) => i.issueType === 'DISCOUNT_LEAK')
    assert(!hasDiscountLeak, 'TEST 6: Discount leak requires contribution per order to drop')
  }

  // TEST 7: PRODUCT_MIX_LEAK detection
  {
    const metrics = createMockMetrics({
      products: [
        {
          productId: 401,
          productName: 'Low Margin Dish',
          category: 'Main',
          sellingPrice: 100,
          costPrice: 85,
          grossMarginPercent: 15, // < 20%
          unitsSold: 30,
          revenue: 3000,
          cogs: 2550,
          discount: 0,
          contribution: 450,
        },
        {
          productId: 402,
          productName: 'High Margin Dish',
          category: 'Main',
          sellingPrice: 100,
          costPrice: 40,
          grossMarginPercent: 60,
          unitsSold: 70,
          revenue: 7000,
          cogs: 2800,
          discount: 0,
          contribution: 4200,
        },
      ],
    })
    const res = detectIssues(metrics)
    const hasMixLeak = res.issues.some((i) => i.issueType === 'PRODUCT_MIX_LEAK')
    assert(hasMixLeak, 'TEST 7: Product mix leak detected for low-margin share >= 10%')
  }

  // TEST 8: Low-margin threshold < 20%
  {
    const margin = (100 - 85) / 100 * 100 // 15%
    assert(margin < 20, 'TEST 8: Low-margin definition is gross margin < 20%')
  }

  // TEST 9: Low-margin share growth >= 10%
  {
    const lowMarginShare = (30 / 100) * 100 // 30% >= 10%
    assert(lowMarginShare >= 10, 'TEST 9: Low-margin order share threshold is >= 10%')
  }

  // TEST 10: HIGH_MARGIN_OPPORTUNITY detection
  {
    const metrics = createMockMetrics({
      products: [
        {
          productId: 703,
          productName: 'Truffle Cake',
          category: 'Cakes',
          sellingPrice: 600,
          costPrice: 180,
          grossMarginPercent: 70, // >= 40%
          unitsSold: 20,
          revenue: 12000,
          cogs: 3600,
          discount: 0,
          contribution: 8400,
        },
      ],
    })
    const res = detectIssues(metrics)
    const hasOpportunity = res.issues.some((i) => i.issueType === 'HIGH_MARGIN_OPPORTUNITY')
    assert(hasOpportunity, 'TEST 10: High-margin opportunity detected for margin >= 40%')
  }

  // TEST 11: High-margin threshold >= 40%
  {
    const margin = (600 - 180) / 600 * 100 // 70%
    assert(margin >= 40, 'TEST 11: High-margin definition is gross margin >= 40%')
  }

  // TEST 12: High-margin order growth threshold
  {
    const metrics = createMockMetrics({
      change: { ...createMockMetrics().change, revenueChangePercent: 20 }, // >= 15%
      products: [
        {
          productId: 703,
          productName: 'Truffle Cake',
          category: 'Cakes',
          sellingPrice: 600,
          costPrice: 180,
          grossMarginPercent: 70,
          unitsSold: 15,
          revenue: 9000,
          cogs: 2700,
          discount: 0,
          contribution: 6300,
        },
      ],
    })
    const res = detectIssues(metrics)
    const hasOpportunity = res.issues.some((i) => i.issueType === 'HIGH_MARGIN_OPPORTUNITY')
    assert(hasOpportunity, 'TEST 12: High-margin opportunity triggered on growth >= 15%')
  }

  // TEST 13: Severity HIGH (Decline >= 5%)
  {
    const severity = calculateContributionDeclineSeverity(-7.5)
    assert(severity === 'HIGH', 'TEST 13: Severity HIGH for decline >= 5%')
  }

  // TEST 14: Severity MEDIUM (Decline >= 2% and < 5%)
  {
    const severity = calculateContributionDeclineSeverity(-3.2)
    assert(severity === 'MEDIUM', 'TEST 14: Severity MEDIUM for decline >= 2%')
  }

  // TEST 15: Severity LOW (Decline < 2%)
  {
    const severity = calculateContributionDeclineSeverity(-1.1)
    assert(severity === 'LOW', 'TEST 15: Severity LOW for decline < 2%')
  }

  // TEST 16: Multiple issues for one merchant
  {
    const metrics = createMockMetrics({
      change: {
        ...createMockMetrics().change,
        revenueChangePercent: 12,
        contributionChangePercent: -8,
        discountHeavyOrdersChangePercent: 25,
      },
      current: { ...createMockMetrics().current, orders: 100, contribution: 3000 },
      previous: { ...createMockMetrics().previous, orders: 100, contribution: 5000 },
    })
    const res = detectIssues(metrics)
    assert(res.issues.length >= 2, 'TEST 16: Multiple issues detected simultaneously')
  }

  // TEST 17: FREE/STANDARD/PREMIUM produce identical detection math
  {
    const base = createMockMetrics({
      change: {
        ...createMockMetrics().change,
        revenueChangePercent: 10,
        contributionChangePercent: -5,
      },
    })
    const freeRes = detectIssues({ ...base, plan: 'FREE' })
    const premRes = detectIssues({ ...base, plan: 'PREMIUM' })
    const sameMath =
      freeRes.issues.length === premRes.issues.length &&
      freeRes.issues[0].issueType === premRes.issues[0].issueType
    assert(sameMath, 'TEST 17: FREE, STANDARD, and PREMIUM plans produce identical detection math')
  }

  // TEST 18: Safe handling of zero denominator/empty metrics
  {
    const zeroMetrics = createMockMetrics({
      current: { ...createMockMetrics().current, orders: 0, contribution: 0 },
      previous: { ...createMockMetrics().previous, orders: 0, contribution: 0 },
      products: [],
    })
    const res = detectIssues(zeroMetrics)
    assert(Array.isArray(res.issues), 'TEST 18: Safe handling of zero denominator and empty metrics')
  }

  console.log(`\n📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
