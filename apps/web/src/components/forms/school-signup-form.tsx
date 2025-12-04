'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/forms/form-field'
import { schoolSignupSchema, type SchoolSignupFormData } from '@/lib/validations/auth'
import { authService } from '@/services/auth'

export function SchoolSignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SchoolSignupFormData>({
    resolver: zodResolver(schoolSignupSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: SchoolSignupFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.schoolSignup(data)
      
      toast.success('School registration successful! Please check your email for verification.')
      router.push('/auth/login?message=registration-success')
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Registration failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="First Name"
          type="text"
          placeholder="Enter your first name"
          error={errors.firstName?.message}
          required
          {...register('firstName')}
        />

        <FormField
          label="Last Name"
          type="text"
          placeholder="Enter your last name"
          error={errors.lastName?.message}
          required
          {...register('lastName')}
        />
      </div>

      <FormField
        label="School Name"
        type="text"
        placeholder="Enter your school name"
        error={errors.schoolName?.message}
        required
        {...register('schoolName')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Email"
          type="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <FormField
          label="Phone"
          type="tel"
          placeholder="Enter your phone number"
          error={errors.phone?.message}
          required
          {...register('phone')}
        />
      </div>

      <FormField
        label="Address"
        type="text"
        placeholder="Enter school address"
        error={errors.address?.message}
        required
        {...register('address')}
      />

      <div className="relative">
        <FormField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a password"
          error={errors.password?.message}
          required
          {...register('password')}
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
            Creating Account...
          </>
        ) : (
          'Create School Account'
        )}
      </Button>

      <div className="text-center">
        <span className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </span>
      </div>
    </form>
  )
}
