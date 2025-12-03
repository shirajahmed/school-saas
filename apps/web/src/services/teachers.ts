import { apiService } from './api';
import { Teacher, CreateTeacherData, UpdateTeacherData } from '@/types/teacher';
import { PaginatedResponse } from '@/types/common';

export const teacherService = {
  // Get all teachers
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
  }): Promise<PaginatedResponse<Teacher>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.department) queryParams.append('department', params.department);
    
    const query = queryParams.toString();
    return apiService.get<PaginatedResponse<Teacher>>(
      `/teachers${query ? `?${query}` : ''}`
    );
  },

  // Get teacher by ID
  getById: async (id: string): Promise<Teacher> => {
    return apiService.get<Teacher>(`/teachers/${id}`);
  },

  // Create new teacher
  create: async (data: CreateTeacherData): Promise<Teacher> => {
    return apiService.post<Teacher>('/teachers', data);
  },

  // Update teacher
  update: async (id: string, data: UpdateTeacherData): Promise<Teacher> => {
    return apiService.put<Teacher>(`/teachers/${id}`, data);
  },

  // Delete teacher
  delete: async (id: string): Promise<void> => {
    return apiService.delete<void>(`/teachers/${id}`);
  },

  // Get teacher's classes
  getClasses: async (id: string): Promise<any[]> => {
    return apiService.get<any[]>(`/teachers/${id}/classes`);
  },

  // Assign classes to teacher
  assignClasses: async (id: string, classIds: string[]): Promise<void> => {
    return apiService.post<void>(`/teachers/${id}/classes`, { classIds });
  },
};
