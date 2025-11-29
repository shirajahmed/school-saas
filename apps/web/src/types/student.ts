export interface Student {
  id: string;
  userId: string;
  branchId: string;
  rollNumber: string;
  admissionNo: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  parentPhone?: string;
  parentEmail?: string;
  classId?: string;
  sectionId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  class?: {
    name: string;
    grade: number;
  };
  section?: {
    name: string;
  };
}

export interface CreateStudentData {
  userId: string;
  rollNumber: string;
  admissionNo: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  parentPhone?: string;
  parentEmail?: string;
  classId?: string;
  sectionId?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {}
