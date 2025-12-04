import axios from 'axios'
import { LoginFormData, SchoolSignupFormData, ForgotPasswordFormData, ResetPasswordFormData } from '@/lib/validations/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export const authService = {
  login: async (data: LoginFormData) => {
    try {
      const response = await api.post('/auth/login', data)
      return response.data
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please make sure the API server is running on port 3001.')
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  schoolSignup: async (data: SchoolSignupFormData) => {
    try {
      const response = await api.post('/auth/school-signup', data)
      return response.data
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please make sure the API server is running on port 3001.')
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  forgotPassword: async (data: ForgotPasswordFormData) => {
    try {
      const response = await api.post('/auth/forgot-password', data)
      return response.data
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please make sure the API server is running on port 3001.')
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  resetPassword: async (data: ResetPasswordFormData) => {
    try {
      const response = await api.post('/auth/reset-password', data)
      return response.data
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please make sure the API server is running on port 3001.')
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },
}
