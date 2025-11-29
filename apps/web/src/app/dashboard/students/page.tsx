'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/tables/data-table';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StudentForm } from '@/components/forms/student-form';
import { useLanguage } from '@/providers/language-provider';
import { useToast } from '@/providers/toast-provider';
import { studentService } from '@/services/students';
import { Student } from '@/types/student';
import { TableColumn } from '@/types/common';

export default function StudentsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      // For demo, using mock data
      const mockStudents: Student[] = [
        {
          id: '1',
          userId: 'user1',
          branchId: 'branch1',
          rollNumber: 'ST001',
          admissionNo: 'ADM2024001',
          dateOfBirth: '2010-05-15',
          gender: 'Male',
          classId: 'class1',
          sectionId: 'section1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@email.com',
            phone: '+1234567890'
          },
          class: {
            name: 'Class 10',
            grade: 10
          },
          section: {
            name: 'A'
          }
        },
        {
          id: '2',
          userId: 'user2',
          branchId: 'branch1',
          rollNumber: 'ST002',
          admissionNo: 'ADM2024002',
          dateOfBirth: '2010-08-22',
          gender: 'Female',
          classId: 'class1',
          sectionId: 'section1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          user: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@email.com',
            phone: '+1234567891'
          },
          class: {
            name: 'Class 10',
            grade: 10
          },
          section: {
            name: 'A'
          }
        }
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    
    try {
      await studentService.delete(deletingStudent.id);
      toast({
        title: 'Success',
        description: 'Student deleted successfully',
        type: 'success'
      });
      // Remove from local state for demo
      setStudents(prev => prev.filter(s => s.id !== deletingStudent.id));
    } catch (error) {
      console.error('Failed to delete student:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete student',
        type: 'error'
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingStudent(null);
    loadStudents();
    toast({
      title: 'Success',
      description: editingStudent ? 'Student updated successfully' : 'Student created successfully',
      type: 'success'
    });
  };

  const columns: TableColumn[] = [
    {
      key: 'rollNumber',
      title: 'Roll Number',
      sortable: true,
      width: '120px'
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (_, record) => `${record.user.firstName} ${record.user.lastName}`
    },
    {
      key: 'email',
      title: 'Email',
      render: (_, record) => record.user.email
    },
    {
      key: 'class',
      title: 'Class',
      render: (_, record) => record.class ? `${record.class.name} - ${record.section?.name}` : 'N/A'
    },
    {
      key: 'admissionNo',
      title: 'Admission No',
      sortable: true
    },
    {
      key: 'gender',
      title: 'Gender',
      width: '100px'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('nav.students')}</h1>
          <p className="text-muted-foreground">
            Manage student information and records
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={students}
            columns={columns}
            loading={loading}
            searchable
            actions={(row) => (
              <>
                <DropdownMenuItem onClick={() => setViewingStudent(row)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingStudent(row)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeletingStudent(row)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          />
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Student"
        size="lg"
      >
        <div className="p-6">
          <StudentForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Edit Student"
        size="lg"
      >
        <div className="p-6">
          {editingStudent && (
            <StudentForm
              student={editingStudent}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditingStudent(null)}
            />
          )}
        </div>
      </Modal>

      {/* View Student Modal */}
      <Modal
        isOpen={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        title="Student Details"
        size="lg"
      >
        <div className="p-6">
          {viewingStudent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
                  <p>{viewingStudent.user.firstName} {viewingStudent.user.lastName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                  <p>{viewingStudent.user.email}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Roll Number</h3>
                  <p>{viewingStudent.rollNumber}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Admission No</h3>
                  <p>{viewingStudent.admissionNo}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Gender</h3>
                  <p>{viewingStudent.gender || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Date of Birth</h3>
                  <p>{viewingStudent.dateOfBirth || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Class</h3>
                  <p>{viewingStudent.class ? `${viewingStudent.class.name} - ${viewingStudent.section?.name}` : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Phone</h3>
                  <p>{viewingStudent.user.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        description={`Are you sure you want to delete ${deletingStudent?.user.firstName} ${deletingStudent?.user.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
