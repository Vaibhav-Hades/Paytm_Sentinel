import { createAIOutputSchema } from './schemas'
import { generateAIReasoning, LLMCaller } from './index'
import { AIEngineInput } from './types'

function createMockInput(overrides: Partial<AIEngineInput> = {}): AIEngineInput {
  return {
    merchant: {
      id: 1,
      name: 'Brew & Bean Artisan Café',
      businessType: 'CAFÉ',
      area: 'Connaught Place, New Delhi',
      plan: 'PREMIUM',
    },
    issue: {
      type: 'REVENUE_CONTRIBUTION_DIVERGENCE',
      severity: 'HIGH',
      signals: {
        revenueChangePercent: 88.8,
        contributionChangePercent: -15.6,
      },
    },
    economicSignals: {
      revenueChange: 88.8,
      contributionChange: -15.6,
      discountOrderChange: 835.3,
    },
    allowedActions: ['REDUCE_DISCOUNT', 'INCREASE_PRICE', 'PROMOTE_HIGH_MARGIN_BUNDLE'],
    ...overrides,
  }
}

class MockLLMCaller implements LLMCaller {
  private response: string

  constructor(response: string) {
    this.response = response
  }

  async callLLM(): Promise<string> {
    return this.response
  }
}

class ErrorLLMCaller implements LLMCaller {
  async callLLM(): Promise<string> {
    throw new Error('xAI API Connection Timeout')
  }
}

async function runTests() {
  console.log('🧪 Starting AI Engine Unit Tests...\n')
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

  const validOutput = {
    problem: 'Revenue is increasing while contribution is declining.',
    evidence: [
      'Revenue increased by 88.8%.',
      'Contribution decreased by 15.6%.',
      'Discount-heavy orders increased by 835.3%.',
    ],
    probableDriver: 'Increased discount-heavy ordering is reducing contribution per order.',
    confidence: 0.88,
    recommendations: [
      {
        action: 'REDUCE_DISCOUNT',
        reason: 'A reduction in blanket discounts will protect gross margins while retaining customer demand.',
        simulationRequired: true,
      },
    ],
  }

  // TEST 1: Valid AI output passes Zod validation
  {
    const schema = createAIOutputSchema(['REDUCE_DISCOUNT', 'INCREASE_PRICE', 'PROMOTE_HIGH_MARGIN_BUNDLE'])
    const result = schema.safeParse(validOutput)
    assert(result.success, 'TEST 1: Valid AI output passes Zod validation')
  }

  // TEST 2: Invalid confidence fails validation (> 1 or < 0)
  {
    const schema = createAIOutputSchema(['REDUCE_DISCOUNT'])
    const invalidConfidence = { ...validOutput, confidence: 1.5 }
    const result = schema.safeParse(invalidConfidence)
    assert(!result.success, 'TEST 2: Invalid confidence (> 1) fails validation')
  }

  // TEST 3: Missing required field fails validation
  {
    const schema = createAIOutputSchema(['REDUCE_DISCOUNT'])
    const missingField = { ...validOutput, probableDriver: undefined }
    const result = schema.safeParse(missingField)
    assert(!result.success, 'TEST 3: Missing required field fails validation')
  }

  // TEST 4: Unknown action fails validation
  {
    const schema = createAIOutputSchema(['REDUCE_DISCOUNT', 'INCREASE_PRICE'])
    const unknownAction = {
      ...validOutput,
      recommendations: [
        {
          action: 'TAKE_LOAN',
          reason: 'Take a bank loan.',
          simulationRequired: false,
        },
      ],
    }
    const result = schema.safeParse(unknownAction)
    assert(!result.success, 'TEST 4: Unknown action (TAKE_LOAN) fails validation')
  }

  // TEST 5: Allowed action passes validation
  {
    const schema = createAIOutputSchema(['REDUCE_DISCOUNT', 'INCREASE_PRICE'])
    const allowed = {
      ...validOutput,
      recommendations: [
        {
          action: 'INCREASE_PRICE',
          reason: 'Moderate price adjustment.',
          simulationRequired: true,
        },
      ],
    }
    const result = schema.safeParse(allowed)
    assert(result.success, 'TEST 5: Allowed action (INCREASE_PRICE) passes validation')
  }

  // TEST 6: AI output cannot introduce an action outside allowedActions
  {
    const input = createMockInput({ allowedActions: ['INCREASE_PRICE'] })
    const invalidActionCaller = new MockLLMCaller(
      JSON.stringify({
        ...validOutput,
        recommendations: [{ action: 'REDUCE_DISCOUNT', reason: 'Not in allowed list', simulationRequired: true }],
      })
    )
    const res = await generateAIReasoning(input, { caller: invalidActionCaller })
    assert(res.status === 'UNAVAILABLE', 'TEST 6: AI output with unauthorized action triggers validation rejection')
  }

  // TEST 7: Malformed model response triggers safe fallback
  {
    const input = createMockInput()
    const malformedCaller = new MockLLMCaller('INVALID_NON_JSON_RESPONSE')
    const res = await generateAIReasoning(input, { caller: malformedCaller })
    assert(res.status === 'UNAVAILABLE', 'TEST 7: Malformed non-JSON response triggers safe fallback')
  }

  // TEST 8: xAI unavailable triggers safe fallback
  {
    const input = createMockInput()
    const errorCaller = new ErrorLLMCaller()
    const res = await generateAIReasoning(input, { caller: errorCaller })
    assert(res.status === 'UNAVAILABLE' && res.message.includes('temporarily unavailable'), 'TEST 8: xAI failure triggers safe fallback')
  }

  // TEST 9: Financial facts remain backend-authoritative
  {
    const input = createMockInput()
    const validCaller = new MockLLMCaller(JSON.stringify(validOutput))
    const res = await generateAIReasoning(input, { caller: validCaller })
    assert(
      res.status === 'SUCCESS' && res.data.evidence.length > 0 && input.economicSignals.revenueChange === 88.8,
      'TEST 9: Financial facts supplied by backend remain immutable source of truth'
    )
  }

  // TEST 10: FREE plan does not receive Standard/Premium AI reasoning
  {
    const input = createMockInput({
      merchant: {
        id: 3,
        name: 'Chai & Co. Express',
        businessType: 'CAFÉ',
        area: 'Connaught Place, New Delhi',
        plan: 'FREE',
      },
    })
    const res = await generateAIReasoning(input)
    assert(
      res.status === 'UNAVAILABLE' && res.message.includes('STANDARD or PREMIUM'),
      'TEST 10: FREE plan is authoritatively gated from AI reasoning'
    )
  }

  // TEST 11: STANDARD plan can use core Sentinel reasoning
  {
    const input = createMockInput({
      merchant: {
        id: 2,
        name: 'The Daily Grind',
        businessType: 'CAFÉ',
        area: 'Connaught Place, New Delhi',
        plan: 'STANDARD',
      },
    })
    const validCaller = new MockLLMCaller(JSON.stringify(validOutput))
    const res = await generateAIReasoning(input, { caller: validCaller })
    assert(res.status === 'SUCCESS', 'TEST 11: STANDARD plan successfully generates AI reasoning')
  }

  // TEST 12: PREMIUM plan can use core Sentinel reasoning
  {
    const input = createMockInput({
      merchant: {
        id: 1,
        name: 'Brew & Bean Artisan Café',
        businessType: 'CAFÉ',
        area: 'Connaught Place, New Delhi',
        plan: 'PREMIUM',
      },
    })
    const validCaller = new MockLLMCaller(JSON.stringify(validOutput))
    const res = await generateAIReasoning(input, { caller: validCaller })
    assert(res.status === 'SUCCESS', 'TEST 12: PREMIUM plan successfully generates AI reasoning')
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
