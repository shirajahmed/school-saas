import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CanManage, CanRead, CanCreate } from '../auth/decorators/permissions.decorator';
import { RequireFeature } from '../auth/decorators/subscription.decorator';
import { PermissionResource } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DepartmentsController {
  constructor(private prisma: PrismaService) {}

  // Get all departments (College feature)
  @Get()
  @CanRead(PermissionResource.BRANCHES)
  @RequireFeature('multi_branch_management') // Enterprise+ feature
  async findAll(@Query() query: any, @Request() req) {
    // Check if school type is college/university
    const school = await this.prisma.school.findUnique({
      where: { id: req.user.schoolId },
      select: { schoolType: true }
    });

    if (!['COLLEGE', 'UNIVERSITY'].includes(school?.schoolType)) {
      throw new Error('Departments are only available for colleges and universities');
    }

    const where: any = { schoolId: req.user.schoolId };
    
    if (query.branchId) where.branchId = query.branchId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.department.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        teachers: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } }
          }
        },
        classes: { select: { id: true, name: true, grade: true } },
        _count: {
          select: {
            teachers: true,
            classes: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  // Get department by ID
  @Get(':id')
  @CanRead(PermissionResource.BRANCHES)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.prisma.department.findFirst({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      include: {
        branch: { select: { id: true, name: true } },
        teachers: {
          select: {
            id: true,
            employeeId: true,
            subject: true,
            qualification: true,
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        classes: {
          select: {
            id: true,
            name: true,
            grade: true,
            students: { select: { id: true } } // Count
          }
        }
      }
    });
  }

  // Create department
  @Post()
  @CanCreate(PermissionResource.BRANCHES)
  @RequireFeature('multi_branch_management')
  async create(@Body() createDepartmentDto: any, @Request() req) {
    const department = await this.prisma.department.create({
      data: {
        schoolId: req.user.schoolId,
        branchId: createDepartmentDto.branchId,
        name: createDepartmentDto.name,
        code: createDepartmentDto.code,
        head: createDepartmentDto.head
      },
      include: {
        branch: { select: { id: true, name: true } }
      }
    });

    return {
      message: 'Department created successfully',
      department
    };
  }

  // Update department
  @Put(':id')
  @CanManage(PermissionResource.BRANCHES)
  async update(@Param('id') id: string, @Body() updateDepartmentDto: any, @Request() req) {
    const updatedDepartment = await this.prisma.department.update({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      data: {
        name: updateDepartmentDto.name,
        code: updateDepartmentDto.code,
        head: updateDepartmentDto.head,
        isActive: updateDepartmentDto.isActive
      },
      include: {
        branch: { select: { id: true, name: true } }
      }
    });

    return {
      message: 'Department updated successfully',
      department: updatedDepartment
    };
  }

  // Delete department
  @Delete(':id')
  @CanManage(PermissionResource.BRANCHES)
  async remove(@Param('id') id: string, @Request() req) {
    // Check if department has teachers or classes
    const [teachersCount, classesCount] = await Promise.all([
      this.prisma.teacher.count({ where: { departmentId: id } }),
      this.prisma.class.count({ where: { departmentId: id } })
    ]);

    if (teachersCount > 0 || classesCount > 0) {
      throw new Error(`Cannot delete department. It has ${teachersCount} teachers and ${classesCount} classes.`);
    }

    await this.prisma.department.delete({
      where: { 
        id,
        schoolId: req.user.schoolId 
      }
    });

    return { message: 'Department deleted successfully' };
  }

  // Get department teachers
  @Get(':id/teachers')
  @CanRead(PermissionResource.TEACHERS)
  async getTeachers(@Param('id') id: string, @Request() req) {
    return this.prisma.teacher.findMany({
      where: {
        departmentId: id,
        schoolId: req.user.schoolId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        classes: { select: { id: true, name: true } }
      },
      orderBy: { employeeId: 'asc' }
    });
  }

  // Get department classes
  @Get(':id/classes')
  @CanRead(PermissionResource.CLASSES)
  async getClasses(@Param('id') id: string, @Request() req) {
    return this.prisma.class.findMany({
      where: {
        departmentId: id,
        schoolId: req.user.schoolId
      },
      include: {
        teacher: {
          select: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        students: { select: { id: true } } // Count
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }]
    });
  }
}
