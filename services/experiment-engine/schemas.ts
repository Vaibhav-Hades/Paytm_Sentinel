import { z } from 'zod'
import { ExperimentMetric, ExperimentStatus } from '@prisma/client'

export const ExperimentMetricEnum = z.nativeEnum(ExperimentMetric)
export const ExperimentStatusEnum = z.nativeEnum(ExperimentStatus)

export const CreateExperimentSchema = z.object({
  merchantId: z.number().int().positive({ message: 'Valid merchantId is required.' }),
  productId: z.number().int().positive({ message: 'Valid productId is required.' }),
  insightId: z.number().int().positive({ message: 'Valid insightId is required.' }),
  type: z.string().min(1, { message: 'Experiment type is required.' }),
  oldValue: z.number().finite({ message: 'oldValue must be a finite number.' }),
  newValue: z.number().finite({ message: 'newValue must be a finite number.' }),
  durationDays: z.number().int().positive({ message: 'durationDays must be a positive integer.' }).default(7),
  metric: ExperimentMetricEnum.default(ExperimentMetric.CONTRIBUTION),
})

export const ApproveExperimentSchema = z.object({
  experimentId: z.number().int().positive({ message: 'Valid experimentId is required.' }),
  merchantId: z.number().int().positive().optional(),
})

export const CompleteExperimentSchema = z.object({
  experimentId: z.number().int().positive({ message: 'Valid experimentId is required.' }),
  merchantId: z.number().int().positive().optional(),
})
