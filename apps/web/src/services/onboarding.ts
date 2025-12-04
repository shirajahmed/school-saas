import axios from 'axios'
import { Step1Data, Step2Data, Step3Data } from '@/lib/validations/onboarding'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export const onboardingService = {
  getStatus: async (token: string) => {
    try {
      const response = await api.get(`/onboarding/status?token=${token}`)
      return response.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('Failed to get onboarding status')
    }
  },

  submitStep: async (token: string, step: number, stepData: Step1Data | Step2Data | Step3Data) => {
    try {
      const response = await api.post('/onboarding/step', {
        token,
        step,
        stepData,
      })
      return response.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  complete: async (token: string) => {
    try {
      const response = await api.post('/onboarding/complete', { token })
      return response.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('Failed to complete onboarding')
    }
  },

  getPlans: async () => {
    try {
      const response = await api.get('/onboarding/plans')
      return response.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('Failed to load plans')
    }
  },

  getSchoolTypes: async () => {
    try {
      const response = await api.get('/onboarding/school-types')
      return response.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('Failed to load school types')
    }
  },

  getLanguages: async () => {
    try {
      const response = await api.get('/onboarding/languages')
      return response.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('Failed to load languages')
    }
  },
}
