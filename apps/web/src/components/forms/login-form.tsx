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
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { authService } from '@/services/auth'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('refreshToken', response.refreshToken)
        toast.success('Login successful!')
        router.push('/dashboard')
      }
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Login failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Email or Phone"
        type="text"
        placeholder="Enter your email or phone number"
        error={errors.identifier?.message}
        required
        {...register('identifier')}
      />

      <div className="relative">
        <FormField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
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

      <div className="flex items-center justify-between">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <div className="text-center">
        <span className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </span>
      </div>
    </form>
  )
}
