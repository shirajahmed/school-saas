import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export enum Permission {
  // School Management
  MANAGE_SCHOOLS = 'manage_schools',
  VIEW_SCHOOLS = 'view_schools',
  
  // Branch Management
  MANAGE_BRANCHES = 'manage_branches',
  VIEW_BRANCHES = 'view_branches',
  
  // User Management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  
  // Student Management
  MANAGE_STUDENTS = 'manage_students',
  VIEW_STUDENTS = 'view_students',
  
  // Teacher Management
  MANAGE_TEACHERS = 'manage_teachers',
  VIEW_TEACHERS = 'view_teachers',
  
  // Class Management
  MANAGE_CLASSES = 'manage_classes',
  VIEW_CLASSES = 'view_classes',
  
  // Attendance
  MANAGE_ATTENDANCE = 'manage_attendance',
  VIEW_ATTENDANCE = 'view_attendance',
  
  // Exams & Results
  MANAGE_EXAMS = 'manage_exams',
  VIEW_EXAMS = 'view_exams',
  MANAGE_RESULTS = 'manage_results',
  VIEW_RESULTS = 'view_results',
}

@Injectable()
export class PermissionService {
  private readonly rolePermissions: Record<UserRole, Permission[]> = {
    [UserRole.SUPER_ADMIN]: [
      Permission.MANAGE_SCHOOLS,
      Permission.VIEW_SCHOOLS,
      Permission.MANAGE_BRANCHES,
      Permission.VIEW_BRANCHES,
      Permission.MANAGE_USERS,
      Permission.VIEW_USERS,
      Permission.MANAGE_STUDENTS,
      Permission.VIEW_STUDENTS,
      Permission.MANAGE_TEACHERS,
      Permission.VIEW_TEACHERS,
      Permission.MANAGE_CLASSES,
      Permission.VIEW_CLASSES,
      Permission.MANAGE_ATTENDANCE,
      Permission.VIEW_ATTENDANCE,
      Permission.MANAGE_EXAMS,
      Permission.VIEW_EXAMS,
      Permission.MANAGE_RESULTS,
      Permission.VIEW_RESULTS,
    ],
    [UserRole.SCHOOL_ADMIN]: [
      Permission.VIEW_SCHOOLS,
      Permission.MANAGE_BRANCHES,
      Permission.VIEW_BRANCHES,
      Permission.MANAGE_USERS,
      Permission.VIEW_USERS,
      Permission.MANAGE_STUDENTS,
      Permission.VIEW_STUDENTS,
      Permission.MANAGE_TEACHERS,
      Permission.VIEW_TEACHERS,
      Permission.MANAGE_CLASSES,
      Permission.VIEW_CLASSES,
      Permission.MANAGE_ATTENDANCE,
      Permission.VIEW_ATTENDANCE,
      Permission.MANAGE_EXAMS,
      Permission.VIEW_EXAMS,
      Permission.MANAGE_RESULTS,
      Permission.VIEW_RESULTS,
    ],
    [UserRole.BRANCH_ADMIN]: [
      Permission.VIEW_BRANCHES,
      Permission.MANAGE_USERS,
      Permission.VIEW_USERS,
      Permission.MANAGE_STUDENTS,
      Permission.VIEW_STUDENTS,
      Permission.MANAGE_TEACHERS,
      Permission.VIEW_TEACHERS,
      Permission.MANAGE_CLASSES,
      Permission.VIEW_CLASSES,
      Permission.MANAGE_ATTENDANCE,
      Permission.VIEW_ATTENDANCE,
      Permission.MANAGE_EXAMS,
      Permission.VIEW_EXAMS,
      Permission.MANAGE_RESULTS,
      Permission.VIEW_RESULTS,
    ],
    [UserRole.TEACHER]: [
      Permission.VIEW_STUDENTS,
      Permission.VIEW_CLASSES,
      Permission.MANAGE_ATTENDANCE,
      Permission.VIEW_ATTENDANCE,
      Permission.MANAGE_EXAMS,
      Permission.VIEW_EXAMS,
      Permission.MANAGE_RESULTS,
      Permission.VIEW_RESULTS,
    ],
    [UserRole.STUDENT]: [
      Permission.VIEW_ATTENDANCE,
      Permission.VIEW_EXAMS,
      Permission.VIEW_RESULTS,
    ],
    [UserRole.PARENT]: [
      Permission.VIEW_ATTENDANCE,
      Permission.VIEW_EXAMS,
      Permission.VIEW_RESULTS,
    ],
  };

  hasPermission(userRoles: UserRole[], permission: Permission): boolean {
    return userRoles.some(role => 
      this.rolePermissions[role]?.includes(permission)
    );
  }

  getUserPermissions(userRoles: UserRole[]): Permission[] {
    const permissions = new Set<Permission>();
    
    userRoles.forEach(role => {
      this.rolePermissions[role]?.forEach(permission => {
        permissions.add(permission);
      });
    });
    
    return Array.from(permissions);
  }
}
