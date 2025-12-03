import { UserRole } from '@/types/auth';

export const ROLE_HIERARCHY = {
  [UserRole.SUPER_ADMIN]: 6,
  [UserRole.SCHOOL_ADMIN]: 5,
  [UserRole.BRANCH_ADMIN]: 4,
  [UserRole.TEACHER]: 3,
  [UserRole.STUDENT]: 2,
  [UserRole.PARENT]: 1,
};

export function hasRole(userRoles: UserRole[], requiredRole: UserRole): boolean {
  return userRoles.includes(requiredRole);
}

export function hasAnyRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

export function hasHigherRole(userRoles: UserRole[], minimumRole: UserRole): boolean {
  const userLevel = Math.max(...userRoles.map(role => ROLE_HIERARCHY[role] || 0));
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= requiredLevel;
}

export function canAccessModule(userRoles: UserRole[], module: string): boolean {
  // Define module access rules
  const moduleAccess: Record<string, UserRole[]> = {
    dashboard: Object.values(UserRole),
    students: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER],
    teachers: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN],
    classes: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER],
    attendance: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER],
    exams: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER],
    reports: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN],
    ai: Object.values(UserRole),
    account: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
    settings: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN],
  };

  const allowedRoles = moduleAccess[module] || [];
  return hasAnyRole(userRoles, allowedRoles);
}
