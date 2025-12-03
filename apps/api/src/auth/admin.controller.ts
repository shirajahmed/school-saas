import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { CanManage, CanCreate, CanRead, RequirePermissions } from './decorators/permissions.decorator';
import { PermissionService } from './services/permission.service';
import { AuthService } from './services/auth.service';
import { PermissionResource, PermissionAction, UserRole } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminController {
  constructor(
    private permissionService: PermissionService,
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  // Create Super Admin (Master Super Admin only)
  @Post('super-admin')
  @RequirePermissions({ resource: PermissionResource.USERS, action: PermissionAction.MANAGE })
  async createSuperAdmin(@Body() createUserDto: any, @Request() req) {
    // Only Master Super Admin can create Super Admins
    const creator = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    
    if (!creator?.isMaster || creator.role !== UserRole.MASTER_SUPER_ADMIN) {
      throw new Error('Only Master Super Admin can create Super Admins');
    }

    return this.authService.createUser({
      ...createUserDto,
      role: UserRole.SUPER_ADMIN
    }, req.user.sub);
  }

  // Assign custom permissions to user
  @Post('permissions/:userId')
  @CanManage(PermissionResource.USERS)
  async assignPermissions(
    @Param('userId') userId: string,
    @Body() permissionDto: {
      resource: PermissionResource;
      actions: PermissionAction[];
      conditions?: any;
    },
    @Request() req
  ) {
    return this.permissionService.assignPermissions(
      userId,
      permissionDto.resource,
      permissionDto.actions,
      permissionDto.conditions,
      req.user.sub
    );
  }

  // Get user permissions
  @Get('permissions/:userId')
  @CanRead(PermissionResource.USERS)
  async getUserPermissions(@Param('userId') userId: string) {
    return this.permissionService.getUserPermissions(userId);
  }

  // List all users with their roles and permissions
  @Get('users')
  @CanRead(PermissionResource.USERS)
  async listUsers(@Query() query: { role?: UserRole; schoolId?: string }) {
    const where: any = {};
    
    if (query.role) where.role = query.role;
    if (query.schoolId) where.schoolId = query.schoolId;

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isMaster: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        rolePermissions: {
          select: {
            resource: true,
            actions: true,
            conditions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Update user role (with hierarchy validation)
  @Put('users/:userId/role')
  @CanManage(PermissionResource.USERS)
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() roleDto: { role: UserRole },
    @Request() req
  ) {
    const creator = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    
    if (!this.permissionService.validateRoleHierarchy(creator.role, roleDto.role)) {
      throw new Error(`You cannot assign role: ${roleDto.role}`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: roleDto.role }
    });
  }

  // Deactivate user
  @Put('users/:userId/deactivate')
  @CanManage(PermissionResource.USERS)
  async deactivateUser(@Param('userId') userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' }
    });
  }

  // Get permission templates
  @Get('permission-templates')
  @CanRead(PermissionResource.SETTINGS)
  async getPermissionTemplates() {
    return this.prisma.permissionTemplate.findMany({
      orderBy: { role: 'asc' }
    });
  }

  // Create permission template
  @Post('permission-templates')
  @CanManage(PermissionResource.SETTINGS)
  async createPermissionTemplate(@Body() templateDto: {
    name: string;
    description?: string;
    role: UserRole;
    resource: PermissionResource;
    actions: PermissionAction[];
    conditions?: any;
  }) {
    return this.prisma.permissionTemplate.create({
      data: templateDto
    });
  }

  // Get system analytics (Master Super Admin only)
  @Get('analytics')
  @RequirePermissions({ resource: PermissionResource.ANALYTICS, action: PermissionAction.READ })
  async getSystemAnalytics(@Request() req) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    
    if (!user?.isMaster) {
      throw new Error('Access denied');
    }

    const stats = await Promise.all([
      this.prisma.school.count(),
      this.prisma.user.count(),
      this.prisma.student.count(),
      this.prisma.subscription.groupBy({
        by: ['plan'],
        _count: { plan: true }
      })
    ]);

    return {
      totalSchools: stats[0],
      totalUsers: stats[1],
      totalStudents: stats[2],
      subscriptionBreakdown: stats[3]
    };
  }
}
