import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { UserRole, PermissionAction, PermissionResource } from '@prisma/client';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  // Check if user has permission for specific action on resource
  async hasPermission(
    userId: string, 
    resource: PermissionResource, 
    action: PermissionAction,
    context?: any
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { rolePermissions: true }
    });

    if (!user) return false;

    // Master Super Admin has all permissions
    if (user.isMaster && user.role === UserRole.MASTER_SUPER_ADMIN) {
      return true;
    }

    // Check role-based permissions
    const permission = user.rolePermissions.find(p => p.resource === resource);
    
    if (!permission) {
      // Use default role permissions if no custom permissions set
      return this.hasDefaultRolePermission(user.role, resource, action);
    }

    // Check if user has the specific action permission
    const hasAction = permission.actions.includes(action) || permission.actions.includes(PermissionAction.MANAGE);
    
    if (!hasAction) return false;

    // Check additional conditions
    if (permission.conditions) {
      return this.checkConditions(permission.conditions as any, user, context);
    }

    return true;
  }

  // Assign custom permissions to user
  async assignPermissions(
    userId: string, 
    resource: PermissionResource, 
    actions: PermissionAction[],
    conditions?: any,
    assignedBy?: string
  ) {
    // Check if assigner has permission to assign
    if (assignedBy) {
      const canAssign = await this.hasPermission(assignedBy, PermissionResource.USERS, PermissionAction.MANAGE);
      if (!canAssign) {
        throw new ForbiddenException('You do not have permission to assign permissions');
      }
    }

    return this.prisma.rolePermission.upsert({
      where: {
        userId_resource: { userId, resource }
      },
      create: {
        userId,
        resource,
        actions,
        conditions: conditions || {}
      },
      update: {
        actions,
        conditions: conditions || {}
      }
    });
  }

  // Get user's effective permissions
  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { rolePermissions: true }
    });

    if (!user) return [];

    // Master Super Admin gets all permissions
    if (user.isMaster && user.role === UserRole.MASTER_SUPER_ADMIN) {
      return this.getAllPermissions();
    }

    const customPermissions = user.rolePermissions.map(p => ({
      resource: p.resource,
      actions: p.actions,
      conditions: p.conditions
    }));

    // Merge with default role permissions
    const defaultPermissions = this.getDefaultRolePermissions(user.role);
    
    return this.mergePermissions(defaultPermissions, customPermissions);
  }

  // Validate role hierarchy for user creation
  validateRoleHierarchy(creatorRole: UserRole, targetRole: UserRole): boolean {
    const hierarchy = {
      [UserRole.MASTER_SUPER_ADMIN]: [
        UserRole.SUPER_ADMIN, 
        UserRole.SCHOOL_ADMIN, 
        UserRole.BRANCH_ADMIN, 
        UserRole.SUB_BRANCH_ADMIN,
        UserRole.TEACHER, 
        UserRole.STUDENT, 
        UserRole.PARENT
      ],
      [UserRole.SUPER_ADMIN]: [
        UserRole.SCHOOL_ADMIN, 
        UserRole.BRANCH_ADMIN, 
        UserRole.SUB_BRANCH_ADMIN,
        UserRole.TEACHER, 
        UserRole.STUDENT, 
        UserRole.PARENT
      ],
      [UserRole.SCHOOL_ADMIN]: [
        UserRole.BRANCH_ADMIN, 
        UserRole.SUB_BRANCH_ADMIN,
        UserRole.TEACHER, 
        UserRole.STUDENT, 
        UserRole.PARENT
      ],
      [UserRole.BRANCH_ADMIN]: [
        UserRole.SUB_BRANCH_ADMIN,
        UserRole.TEACHER, 
        UserRole.STUDENT, 
        UserRole.PARENT
      ],
      [UserRole.SUB_BRANCH_ADMIN]: [
        UserRole.TEACHER, 
        UserRole.STUDENT, 
        UserRole.PARENT
      ]
    };

    return hierarchy[creatorRole]?.includes(targetRole) || false;
  }

  // Private helper methods
  private hasDefaultRolePermission(role: UserRole, resource: PermissionResource, action: PermissionAction): boolean {
    const defaultPermissions = this.getDefaultRolePermissions(role);
    const resourcePermission = defaultPermissions.find(p => p.resource === resource);
    
    if (!resourcePermission) return false;
    
    return resourcePermission.actions.includes(action) || 
           resourcePermission.actions.includes(PermissionAction.MANAGE);
  }

  private getDefaultRolePermissions(role: UserRole): Array<{resource: PermissionResource, actions: PermissionAction[]}> {
    const permissions = {
      [UserRole.MASTER_SUPER_ADMIN]: [
        { resource: PermissionResource.USERS, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.SCHOOLS, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.SUBSCRIPTIONS, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.ANALYTICS, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.SETTINGS, actions: [PermissionAction.MANAGE] }
      ],
      [UserRole.SUPER_ADMIN]: [
        { resource: PermissionResource.SCHOOLS, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE] },
        { resource: PermissionResource.USERS, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE] },
        { resource: PermissionResource.ANALYTICS, actions: [PermissionAction.READ] }
      ],
      [UserRole.SCHOOL_ADMIN]: [
        { resource: PermissionResource.BRANCHES, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.USERS, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE] },
        { resource: PermissionResource.STUDENTS, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.TEACHERS, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.CLASSES, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.REPORTS, actions: [PermissionAction.READ] }
      ],
      [UserRole.BRANCH_ADMIN]: [
        { resource: PermissionResource.USERS, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE] },
        { resource: PermissionResource.STUDENTS, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.TEACHERS, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.CLASSES, actions: [PermissionAction.MANAGE] },
        { resource: PermissionResource.ATTENDANCE, actions: [PermissionAction.READ] }
      ],
      [UserRole.SUB_BRANCH_ADMIN]: [
        { resource: PermissionResource.STUDENTS, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE] },
        { resource: PermissionResource.TEACHERS, actions: [PermissionAction.READ] },
        { resource: PermissionResource.ATTENDANCE, actions: [PermissionAction.READ] }
      ],
      [UserRole.TEACHER]: [
        { resource: PermissionResource.STUDENTS, actions: [PermissionAction.READ] },
        { resource: PermissionResource.ATTENDANCE, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE] },
        { resource: PermissionResource.EXAMS, actions: [PermissionAction.MANAGE] }
      ],
      [UserRole.STUDENT]: [
        { resource: PermissionResource.ATTENDANCE, actions: [PermissionAction.READ] },
        { resource: PermissionResource.EXAMS, actions: [PermissionAction.READ] }
      ],
      [UserRole.PARENT]: [
        { resource: PermissionResource.STUDENTS, actions: [PermissionAction.READ] },
        { resource: PermissionResource.ATTENDANCE, actions: [PermissionAction.READ] },
        { resource: PermissionResource.EXAMS, actions: [PermissionAction.READ] }
      ]
    };

    return permissions[role] || [];
  }

  private getAllPermissions() {
    return Object.values(PermissionResource).map(resource => ({
      resource,
      actions: [PermissionAction.MANAGE],
      conditions: {}
    }));
  }

  private mergePermissions(defaultPermissions: any[], customPermissions: any[]) {
    const merged = [...defaultPermissions];
    
    customPermissions.forEach(custom => {
      const existingIndex = merged.findIndex(p => p.resource === custom.resource);
      if (existingIndex >= 0) {
        merged[existingIndex] = custom; // Override with custom
      } else {
        merged.push(custom); // Add new custom permission
      }
    });

    return merged;
  }

  private checkConditions(conditions: any, user: any, context: any): boolean {
    // Implement condition checking logic
    // Examples: own_branch_only, own_school_only, etc.
    
    if (conditions.own_branch_only && context?.branchId) {
      return user.branchId === context.branchId;
    }

    if (conditions.own_school_only && context?.schoolId) {
      return user.schoolId === context.schoolId;
    }

    return true;
  }
}
