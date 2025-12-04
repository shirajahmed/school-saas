import { z } from 'zod'

export const step1Schema = z.object({
  schoolType: z.enum(['PRIMARY', 'HIGH_SCHOOL', 'COLLEGE', 'UNIVERSITY', 'MIXED'], {
    errorMap: () => ({ message: 'Please select a valid school type' })
  }),
  language: z.enum(['en', 'hi'], {
    errorMap: () => ({ message: 'Please select a valid language' })
  }),
  academicYearStart: z.number().min(1).max(12),
  logo: z.string().url().optional().or(z.literal('')),
})

export const step2Schema = z.object({
  plan: z.enum(['FREETRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'], {
    errorMap: () => ({ message: 'Please select a valid plan' })
  }),
  maxBranches: z.number().min(1),
  features: z.array(z.string()),
})

export const step3Schema = z.object({
  paymentMethod: z.enum(['phonepe', 'stripe'], {
    errorMap: () => ({ message: 'Please select a valid payment method' })
  }),
  paymentToken: z.string().min(1, 'Payment token is required'),
  amount: z.number().min(0),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
