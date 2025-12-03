import { APP_CONFIG, STORAGE_KEYS } from '@/constants/config';

class ApiService {
  private baseURL: string;
  private isDemoMode: boolean = true; // Set to false when backend is ready

  constructor() {
    this.baseURL = APP_CONFIG.apiUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Demo mode - simulate API responses
    if (this.isDemoMode) {
      return this.simulateRequest<T>(endpoint, options);
    }

    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async simulateRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const method = options.method || 'GET';
    
    // Simulate different responses based on endpoint and method
    if (method === 'DELETE') {
      return { success: true } as T;
    }
    
    if (method === 'POST') {
      return { 
        id: Math.random().toString(36).substr(2, 9),
        ...JSON.parse(options.body as string || '{}'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as T;
    }

    if (method === 'PUT') {
      return {
        ...JSON.parse(options.body as string || '{}'),
        updatedAt: new Date().toISOString()
      } as T;
    }

    // Default GET response
    return { data: [] } as T;
  }

  // Generic CRUD operations
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();
