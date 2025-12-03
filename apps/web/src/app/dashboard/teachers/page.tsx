'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/tables/data-table';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { TeacherForm } from '@/components/forms/teacher-form';
import { useLanguage } from '@/providers/language-provider';
import { useToast } from '@/providers/toast-provider';
import { teacherService } from '@/services/teachers';
import { Teacher } from '@/types/teacher';
import { TableColumn } from '@/types/common';

export default function TeachersPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      // For demo, using mock data
      const mockTeachers: Teacher[] = [
        {
          id: '1',
          userId: 'user3',
          branchId: 'branch1',
          employeeId: 'EMP001',
          department: 'Mathematics',
          subject: 'Advanced Mathematics',
          qualification: 'M.Sc Mathematics',
          experience: 5,
          salary: 50000,
          joiningDate: '2020-06-15',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          user: {
            firstName: 'Dr. Sarah',
            lastName: 'Johnson',
            email: 'sarah.johnson@school.com',
            phone: '+1234567892'
          },
          classes: [
            { id: 'class1', name: 'Class 10', grade: 10 },
            { id: 'class2', name: 'Class 12', grade: 12 }
          ]
        },
        {
          id: '2',
          userId: 'user4',
          branchId: 'branch1',
          employeeId: 'EMP002',
          department: 'Science',
          subject: 'Physics',
          qualification: 'M.Sc Physics',
          experience: 8,
          salary: 55000,
          joiningDate: '2018-04-10',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          user: {
            firstName: 'Prof. Michael',
            lastName: 'Brown',
            email: 'michael.brown@school.com',
            phone: '+1234567893'
          },
          classes: [
            { id: 'class3', name: 'Class 11', grade: 11 }
          ]
        }
      ];
      setTeachers(mockTeachers);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teachers',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await teacherService.delete(id);
      toast({
        title: 'Success',
        description: 'Teacher deleted successfully',
        type: 'success'
      });
      loadTeachers();
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete teacher',
        type: 'error'
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTeacher(null);
    loadTeachers();
    toast({
      title: 'Success',
      description: editingTeacher ? 'Teacher updated successfully' : 'Teacher created successfully',
      type: 'success'
    });
  };

  const columns: TableColumn[] = [
    {
      key: 'employeeId',
      title: 'Employee ID',
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
      key: 'department',
      title: 'Department',
      sortable: true
    },
    {
      key: 'subject',
      title: 'Subject',
      sortable: true
    },
    {
      key: 'experience',
      title: 'Experience',
      width: '100px',
      render: (value) => value ? `${value} years` : 'N/A'
    },
    {
      key: 'classes',
      title: 'Classes',
      render: (_, record) => record.classes?.length || 0
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('nav.teachers')}</h1>
          <p className="text-muted-foreground">
            Manage teacher information and assignments
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={teachers}
            columns={columns}
            loading={loading}
            searchable
            actions={(row) => (
              <>
                <DropdownMenuItem onClick={() => setViewingTeacher(row)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingTeacher(row)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast({ title: 'Info', description: 'Class assignment feature coming soon!', type: 'info' })}>
                  <Users className="h-4 w-4 mr-2" />
                  Assign Classes
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDelete(row.id)}
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

      {/* Add Teacher Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Teacher"
        size="lg"
      >
        <div className="p-6">
          <TeacherForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        title="Edit Teacher"
        size="lg"
      >
        <div className="p-6">
          {editingTeacher && (
            <TeacherForm
              teacher={editingTeacher}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditingTeacher(null)}
            />
          )}
        </div>
      </Modal>

      {/* View Teacher Modal */}
      <Modal
        isOpen={!!viewingTeacher}
        onClose={() => setViewingTeacher(null)}
        title="Teacher Details"
        size="lg"
      >
        <div className="p-6">
          {viewingTeacher && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
                  <p>{viewingTeacher.user.firstName} {viewingTeacher.user.lastName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                  <p>{viewingTeacher.user.email}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Employee ID</h3>
                  <p>{viewingTeacher.employeeId}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Department</h3>
                  <p>{viewingTeacher.department || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Subject</h3>
                  <p>{viewingTeacher.subject || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Qualification</h3>
                  <p>{viewingTeacher.qualification || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Experience</h3>
                  <p>{viewingTeacher.experience ? `${viewingTeacher.experience} years` : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Joining Date</h3>
                  <p>{viewingTeacher.joiningDate || 'N/A'}</p>
                </div>
              </div>
              
              {viewingTeacher.classes && viewingTeacher.classes.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Assigned Classes</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingTeacher.classes.map(cls => (
                      <span key={cls.id} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                        {cls.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
