import { z } from 'zod'
import { SimulationChangeTypeEnum } from './types'

export const SimulationRequestSchema = z
  .object({
    merchantId: z.number().int().positive().optional(),
    productId: z.number().int().positive({ message: 'Valid productId is required.' }),
    changeType: SimulationChangeTypeEnum,
    newValue: z.number().finite({ message: 'newValue must be a valid finite number.' }),
  })
  .refine(
    (data) => {
      if (data.changeType === 'PRICE') {
        return data.newValue > 0
      }
      if (data.changeType === 'DISCOUNT') {
        return data.newValue >= 0
      }
      return true
    },
    {
      message: 'PRICE must be strictly positive (> 0); DISCOUNT must be non-negative (>= 0).',
      path: ['newValue'],
    }
  )
