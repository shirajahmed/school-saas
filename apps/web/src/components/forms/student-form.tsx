'use client';

import { Form, FormField } from './form';
import { Student, CreateStudentData } from '@/types/student';
import { studentService } from '@/services/students';

interface StudentFormProps {
  student?: Student;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StudentForm({ student, onSuccess, onCancel }: StudentFormProps) {
  const isEditing = !!student;

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
      name: 'rollNumber',
      label: 'Roll Number',
      type: 'text',
      required: true,
    },
    {
      name: 'admissionNo',
      label: 'Admission Number',
      type: 'text',
      required: true,
    },
    {
      name: 'dateOfBirth',
      label: 'Date of Birth',
      type: 'date',
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      options: [
        { label: 'Select Gender', value: '' },
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      gridCols: 2,
    },
    {
      name: 'parentPhone',
      label: 'Parent Phone',
      type: 'text',
    },
    {
      name: 'parentEmail',
      label: 'Parent Email',
      type: 'email',
    },
  ];

  const initialData = student ? {
    firstName: student.user.firstName,
    lastName: student.user.lastName,
    email: student.user.email,
    phone: student.user.phone || '',
    rollNumber: student.rollNumber,
    admissionNo: student.admissionNo,
    dateOfBirth: student.dateOfBirth || '',
    gender: student.gender || '',
    address: student.address || '',
    parentPhone: student.parentPhone || '',
    parentEmail: student.parentEmail || '',
  } : {};

  const handleSubmit = async (data: any) => {
    try {
      if (isEditing) {
        // Update existing student
        await studentService.update(student.id, {
          rollNumber: data.rollNumber,
          admissionNo: data.admissionNo,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address,
          parentPhone: data.parentPhone,
          parentEmail: data.parentEmail,
        });
      } else {
        // Create new student
        // Note: In real implementation, you'd first create a user, then create student
        const studentData: CreateStudentData = {
          userId: 'temp-user-id', // This would come from user creation
          rollNumber: data.rollNumber,
          admissionNo: data.admissionNo,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address,
          parentPhone: data.parentPhone,
          parentEmail: data.parentEmail,
        };
        await studentService.create(studentData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save student:', error);
      throw error;
    }
  };

  return (
    <Form
      title={isEditing ? 'Edit Student' : 'Add New Student'}
      description={isEditing ? 'Update student information' : 'Create a new student record'}
      fields={fields}
      onSubmit={handleSubmit}
      submitText={isEditing ? 'Update Student' : 'Create Student'}
      initialData={initialData}
    />
  );
}
