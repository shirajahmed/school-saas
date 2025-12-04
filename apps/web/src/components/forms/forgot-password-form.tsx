'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/forms/form-field'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth'
import { authService } from '@/services/auth'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data)
      setIsEmailSent(true)
      toast.success('OTP sent to your email!')
    } catch (error: any) {
      console.error('Forgot password error:', error)
      const message = error.response?.data?.message || error.message || 'Failed to send OTP. Please check your API server.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
          <p className="text-sm text-gray-600 mt-2">
            We've sent a 6-digit OTP to <strong>{getValues('email')}</strong>
          </p>
        </div>
        <Link
          href={`/auth/reset-password?email=${encodeURIComponent(getValues('email'))}`}
          className="inline-block"
        >
          <Button className="w-full">
            Continue to Reset Password
          </Button>
        </Link>
        <button
          onClick={() => setIsEmailSent(false)}
          className="text-sm text-primary hover:underline"
        >
          Use different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
        <p className="text-sm text-gray-600 mt-2">
          Enter your email address and we'll send you an OTP to reset your password.
        </p>
      </div>

      <FormField
        label="Email Address"
        type="email"
        placeholder="Enter your email address"
        error={errors.email?.message}
        required
        {...register('email')}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending OTP...
          </>
        ) : (
          'Send OTP'
        )}
      </Button>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Sign In
        </Link>
      </div>
    </form>
  )
}
