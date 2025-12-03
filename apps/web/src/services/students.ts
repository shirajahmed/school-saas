import { apiService } from './api';
import { Student, CreateStudentData, UpdateStudentData } from '@/types/student';
import { PaginatedResponse } from '@/types/common';

export const studentService = {
  // Get all students
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    classId?: string;
  }): Promise<PaginatedResponse<Student>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.classId) queryParams.append('classId', params.classId);
    
    const query = queryParams.toString();
    return apiService.get<PaginatedResponse<Student>>(
      `/students${query ? `?${query}` : ''}`
    );
  },

  // Get student by ID
  getById: async (id: string): Promise<Student> => {
    return apiService.get<Student>(`/students/${id}`);
  },

  // Create new student
  create: async (data: CreateStudentData): Promise<Student> => {
    return apiService.post<Student>('/students', data);
  },

  // Update student
  update: async (id: string, data: UpdateStudentData): Promise<Student> => {
    return apiService.put<Student>(`/students/${id}`, data);
  },

  // Delete student
  delete: async (id: string): Promise<void> => {
    return apiService.delete<void>(`/students/${id}`);
  },

  // Bulk operations
  bulkDelete: async (ids: string[]): Promise<void> => {
    return apiService.post<void>('/students/bulk-delete', { ids });
  },

  // Import students
  import: async (file: File): Promise<{ success: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Note: This would need special handling for file uploads
    const response = await fetch(`${apiService['baseURL']}/students/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });
    
    return response.json();
  },
};
