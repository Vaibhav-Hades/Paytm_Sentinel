import { AIEngineInput, AIOutput, AIReasoningResponse } from './types'
import { createAIOutputSchema } from './schemas'
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts'

export interface LLMCaller {
  callLLM(systemPrompt: string, userPrompt: string, model: string): Promise<string>
}

/**
 * Native xAI Grok API caller using the OpenAI-compatible endpoint at api.x.ai/v1.
 */
export class DefaultXAICaller implements LLMCaller {
  private apiKey: string | undefined

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.XAI_API_KEY
  }

  async callLLM(systemPrompt: string, userPrompt: string, model: string): Promise<string> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new Error('XAI_API_KEY is missing or not configured.')
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`xAI API error (${response.status}): ${errorText}`)
    }

    const json = await response.json()
    const content = json?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('xAI returned empty response content.')
    }

    return content
  }
}

/**
 * Core AI Reasoning Engine pipeline function.
 * Evaluates facts, checks tier gating, requests LLM diagnosis, and strictly validates structured JSON output with Zod.
 */
export async function generateAIReasoning(
  input: AIEngineInput,
  options: {
    caller?: LLMCaller
    untrustedMerchantInput?: string
    model?: string
  } = {}
): Promise<AIReasoningResponse> {
  // 1. Subscription Tier Gating: FREE tier is not eligible for diagnosis/recommendations
  if (input.merchant.plan === 'FREE') {
    return {
      status: 'UNAVAILABLE',
      message: 'AI diagnosis and recommendations require a STANDARD or PREMIUM subscription plan.',
    }
  }

  const model = options.model ?? process.env.XAI_MODEL ?? 'grok-4.6'
  const caller = options.caller ?? new DefaultXAICaller()
  const userPrompt = buildUserPrompt(input, options.untrustedMerchantInput)
  const validator = createAIOutputSchema(input.allowedActions)

  try {
    const rawContent = await caller.callLLM(SYSTEM_PROMPT, userPrompt, model)
    const parsedJson = JSON.parse(rawContent)

    // Zod validation with allowed-action enforcement
    const validationResult = validator.safeParse(parsedJson)
    if (!validationResult.success) {
      console.warn('AI Output Zod validation failed:', validationResult.error.format())
      return {
        status: 'UNAVAILABLE',
        message: 'AI reasoning response failed schema validation or included unauthorized actions.',
      }
    }

    return {
      status: 'SUCCESS',
      data: validationResult.data as AIOutput,
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error)
    console.warn('AI reasoning engine unavailable:', errMessage)
    return {
      status: 'UNAVAILABLE',
      message: 'AI reasoning is temporarily unavailable.',
    }
  }
}
