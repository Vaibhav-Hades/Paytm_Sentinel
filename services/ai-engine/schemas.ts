import { z } from 'zod'
import { ActionType } from '../detection-engine/types'

/**
 * Creates a dynamic Zod validator for AI Output that strictly restricts
 * recommended actions to the backend-provided allowedActions list.
 */
export function createAIOutputSchema(allowedActions: ActionType[]) {
  return z.object({
    problem: z.string().min(1, 'Problem explanation is required.'),
    evidence: z.array(z.string()).min(1, 'At least one evidence string is required.'),
    probableDriver: z.string().min(1, 'Probable driver explanation is required.'),
    confidence: z.number().min(0).max(1),
    recommendations: z
      .array(
        z.object({
          action: z.custom<ActionType>(
            (val) => typeof val === 'string' && allowedActions.includes(val as ActionType),
            {
              message: `Action must be one of backend allowedActions: [${allowedActions.join(', ')}]`,
            }
          ),
          reason: z.string().min(1, 'Recommendation reasoning is required.'),
          simulationRequired: z.boolean(),
        })
      )
      .min(1, 'At least one recommendation is required.'),
  })
}

/**
 * Static baseline Zod schema for general validation.
 */
export const AIOutputSchema = z.object({
  problem: z.string().min(1),
  evidence: z.array(z.string()).min(1),
  probableDriver: z.string().min(1),
  confidence: z.number().min(0).max(1),
  recommendations: z.array(
    z.object({
      action: z.enum([
        'REDUCE_DISCOUNT',
        'INCREASE_PRICE',
        'PROMOTE_HIGH_MARGIN_BUNDLE',
        'REDUCE_LOW_MARGIN_PROMOTION',
        'INCREASE_HIGH_MARGIN_PRODUCT_VISIBILITY',
      ]),
      reason: z.string().min(1),
      simulationRequired: z.boolean(),
    })
  ),
})
