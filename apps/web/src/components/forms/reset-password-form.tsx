'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/forms/form-field'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth'
import { authService } from '@/services/auth'

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get('email')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  })

  useEffect(() => {
    if (emailFromQuery) {
      setValue('email', emailFromQuery)
    }
  }, [emailFromQuery, setValue])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      await authService.resetPassword(data)
      toast.success('Password reset successful!')
      router.push('/auth/login?message=password-reset-success')
    } catch (error: any) {
      console.error('Reset password error:', error)
      const message = error.response?.data?.message || error.message || 'Failed to reset password. Please check your API server.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-sm text-gray-600 mt-2">
          Enter the OTP sent to your email and create a new password.
        </p>
      </div>

      <FormField
        label="Email Address"
        type="email"
        placeholder="Enter your email address"
        error={errors.email?.message}
        required
        readOnly={!!emailFromQuery}
        {...register('email')}
      />

      <FormField
        label="OTP Code"
        type="text"
        placeholder="Enter 6-digit OTP"
        maxLength={6}
        error={errors.otp?.message}
        required
        {...register('otp')}
      />

      <div className="relative">
        <FormField
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your new password"
          error={errors.newPassword?.message}
          required
          {...register('newPassword')}
        />
        <button
          type="button"
          className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting Password...
          </>
        ) : (
          'Reset Password'
        )}
      </Button>

      <div className="text-center space-y-2">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Didn't receive OTP? Resend
        </Link>
        <div>
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </form>
  )
}
