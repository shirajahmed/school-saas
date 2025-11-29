'use client';

import { Form, FormField } from './form';
import { Teacher, CreateTeacherData } from '@/types/teacher';
import { teacherService } from '@/services/teachers';

interface TeacherFormProps {
  teacher?: Teacher;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TeacherForm({ teacher, onSuccess, onCancel }: TeacherFormProps) {
  const isEditing = !!teacher;

  const fields: FormField[] = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
    },
    {
      name: 'employeeId',
      label: 'Employee ID',
      type: 'text',
      required: true,
    },
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      options: [
        { label: 'Select Department', value: '' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'Science', value: 'Science' },
        { label: 'English', value: 'English' },
        { label: 'Social Studies', value: 'Social Studies' },
        { label: 'Physical Education', value: 'Physical Education' },
        { label: 'Arts', value: 'Arts' },
      ],
    },
    {
      name: 'subject',
      label: 'Subject Specialization',
      type: 'text',
    },
    {
      name: 'qualification',
      label: 'Qualification',
      type: 'text',
    },
    {
      name: 'experience',
      label: 'Experience (Years)',
      type: 'number',
    },
    {
      name: 'salary',
      label: 'Salary',
      type: 'number',
    },
    {
      name: 'joiningDate',
      label: 'Joining Date',
      type: 'date',
    },
  ];

  const initialData = teacher ? {
    firstName: teacher.user.firstName,
    lastName: teacher.user.lastName,
    email: teacher.user.email,
    phone: teacher.user.phone || '',
    employeeId: teacher.employeeId,
    department: teacher.department || '',
    subject: teacher.subject || '',
    qualification: teacher.qualification || '',
    experience: teacher.experience || '',
    salary: teacher.salary || '',
    joiningDate: teacher.joiningDate || '',
  } : {};

  const handleSubmit = async (data: any) => {
    try {
      if (isEditing) {
        // Update existing teacher
        await teacherService.update(teacher.id, {
          employeeId: data.employeeId,
          department: data.department,
          subject: data.subject,
          qualification: data.qualification,
          experience: data.experience ? parseInt(data.experience) : undefined,
          salary: data.salary ? parseFloat(data.salary) : undefined,
          joiningDate: data.joiningDate,
        });
      } else {
        // Create new teacher
        // Note: In real implementation, you'd first create a user, then create teacher
        const teacherData: CreateTeacherData = {
          userId: 'temp-user-id', // This would come from user creation
          employeeId: data.employeeId,
          department: data.department,
          subject: data.subject,
          qualification: data.qualification,
          experience: data.experience ? parseInt(data.experience) : undefined,
          salary: data.salary ? parseFloat(data.salary) : undefined,
          joiningDate: data.joiningDate,
        };
        await teacherService.create(teacherData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save teacher:', error);
      throw error;
    }
  };

  return (
    <Form
      title={isEditing ? 'Edit Teacher' : 'Add New Teacher'}
      description={isEditing ? 'Update teacher information' : 'Create a new teacher record'}
      fields={fields}
      onSubmit={handleSubmit}
      submitText={isEditing ? 'Update Teacher' : 'Create Teacher'}
      initialData={initialData}
    />
  );
}
