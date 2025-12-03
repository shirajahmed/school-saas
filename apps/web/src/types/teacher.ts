export interface Teacher {
  id: string;
  userId: string;
  branchId: string;
  employeeId: string;
  department?: string;
  subject?: string;
  qualification?: string;
  experience?: number;
  salary?: number;
  joiningDate?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  classes?: Array<{
    id: string;
    name: string;
    grade: number;
  }>;
}

export interface CreateTeacherData {
  userId: string;
  employeeId: string;
  department?: string;
  subject?: string;
  qualification?: string;
  experience?: number;
  salary?: number;
  joiningDate?: string;
}

export interface UpdateTeacherData extends Partial<CreateTeacherData> {}
