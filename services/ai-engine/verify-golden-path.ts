import { calculateMerchantMetrics } from '../economic-engine/index'
import { detectIssues } from '../detection-engine/index'
import { generateAIReasoning, LLMCaller } from './index'
import { AIEngineInput } from './types'

// Mock caller for testing end-to-end golden path deterministically
class MockGoldenPathCaller implements LLMCaller {
  async callLLM(): Promise<string> {
    return JSON.stringify({
      problem: 'Revenue is increasing while contribution is declining.',
      evidence: [
        'Revenue increased by 88.8%.',
        'Contribution decreased by 15.6%.',
        'Discount-heavy orders increased by 835.3%.',
      ],
      probableDriver: 'Increased discount-heavy ordering is reducing contribution per order despite higher top-line sales.',
      confidence: 0.88,
      recommendations: [
        {
          action: 'REDUCE_DISCOUNT',
          reason: 'Reducing blanket discounts will protect gross profit while retaining healthy baseline demand.',
          simulationRequired: true,
        },
      ],
    })
  }
}

async function runGoldenPath() {
  console.log('🌟 EXECUTING PHASE 5 GOLDEN-PATH PIPELINE (Merchant 1 - Brew & Bean Artisan Café)\n')

  const refDate = new Date('2026-09-18T00:00:00Z')

  // Step 1: Economic Engine facts
  const merchantMetrics = await calculateMerchantMetrics(1, 'LAST_7_DAYS', refDate)
  console.log('1️⃣ ECONOMIC METRICS RESULT:')
  console.log(`  Merchant: ${merchantMetrics.merchantName} (${merchantMetrics.plan})`)
  console.log(`  Revenue: ₹${merchantMetrics.current.revenue} (Change: ${merchantMetrics.change.revenueChangePercent}%)`)
  console.log(`  Contribution: ₹${merchantMetrics.current.contribution} (Change: ${merchantMetrics.change.contributionChangePercent}%)`)
  console.log(`  Discount: ₹${merchantMetrics.current.discount} (Change: ${merchantMetrics.change.discountChangePercent}%)`)

  // Step 2: Detection Engine issues
  const detection = detectIssues(merchantMetrics)
  console.log('\n2️⃣ DETECTION RESULT:')
  console.log(`  Issues count: ${detection.issues.length}`)
  const primaryIssue = detection.issues[0]
  console.log(`  Primary Issue: ${primaryIssue.issueType} (Severity: ${primaryIssue.severity})`)
  console.log(`  Allowed Actions: ${primaryIssue.allowedActions.join(', ')}`)

  // Step 3: Construct structured AI input
  const aiInput: AIEngineInput = {
    merchant: {
      id: merchantMetrics.merchantId,
      name: merchantMetrics.merchantName,
      businessType: merchantMetrics.businessType,
      area: merchantMetrics.area,
      plan: merchantMetrics.plan,
    },
    issue: {
      type: primaryIssue.issueType,
      severity: primaryIssue.severity,
      signals: primaryIssue.signals,
    },
    economicSignals: {
      revenueChange: merchantMetrics.change.revenueChangePercent,
      contributionChange: merchantMetrics.change.contributionChangePercent,
      discountOrderChange: merchantMetrics.change.discountHeavyOrdersChangePercent,
      ordersChange: merchantMetrics.change.orderChangePercent,
    },
    allowedActions: primaryIssue.allowedActions,
  }

  console.log('\n3️⃣ STRUCTURED AI INPUT:')
  console.log(JSON.stringify(aiInput, null, 2))

  // Step 4: Run AI Reasoning Engine with validation
  const aiResponse = await generateAIReasoning(aiInput, {
    caller: new MockGoldenPathCaller(),
  })

  console.log('\n4️⃣ VALIDATED AI OUTPUT:')
  console.log(JSON.stringify(aiResponse, null, 2))
}

runGoldenPath().catch(console.error)
