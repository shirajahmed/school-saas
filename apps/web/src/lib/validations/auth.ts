import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const schoolSignupSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SchoolSignupFormData = z.infer<typeof schoolSignupSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
