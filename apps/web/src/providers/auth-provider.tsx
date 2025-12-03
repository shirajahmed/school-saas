'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, User, LoginCredentials } from '@/types/auth';
import { STORAGE_KEYS } from '@/constants/config';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Initialize auth state from localStorage
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Demo user for development - remove in production
      const demoUser = {
        id: '1',
        email: credentials.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: ['SCHOOL_ADMIN' as any],
        schoolId: 'school-1',
        branchId: 'branch-1',
        isActive: true,
      };
      const demoToken = 'demo-token-123';

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, demoToken);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(demoUser));

      setState({
        user: demoUser,
        token: demoToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials),
      // });
      // if (!response.ok) throw new Error('Login failed');
      // const { user, token } = await response.json();
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setState(prev => ({ ...prev, user: updatedUser }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
