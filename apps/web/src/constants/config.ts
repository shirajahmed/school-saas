export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'School Management System',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  supportedLanguages: ['en', 'es', 'fr', 'de', 'hi', 'ar'],
  defaultLanguage: 'en',
  defaultTheme: 'light' as const,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  USERS: '/users',
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  CLASSES: '/classes',
  ATTENDANCE: '/attendance',
  EXAMS: '/exams',
} as const;
