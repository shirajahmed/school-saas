import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { CanManage, CanRead, CanCreate } from '../auth/decorators/permissions.decorator';
import { CheckTeacherLimit } from '../auth/decorators/subscription.decorator';
import { PermissionResource } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { AuthService } from '../auth/services/auth.service';

@Controller('teachers')
@UseGuards(JwtAuthGuard, PermissionGuard, SubscriptionGuard)
export class TeachersController {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  // Get all teachers
  @Get()
  @CanRead(PermissionResource.TEACHERS)
  async findAll(@Query() query: any, @Request() req) {
    const where: any = { schoolId: req.user.schoolId };
    
    if (query.branchId) where.branchId = query.branchId;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.subject) where.subject = { contains: query.subject, mode: 'insensitive' };
    if (query.search) {
      where.OR = [
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { employeeId: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.teacher.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true
          }
        },
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } },
        classes: { select: { id: true, name: true, grade: true } }
      },
      orderBy: { employeeId: 'asc' }
    });
  }

  // Get teacher by ID
  @Get(':id')
  @CanRead(PermissionResource.TEACHERS)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.prisma.teacher.findFirst({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        },
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } },
        classes: {
          select: {
            id: true,
            name: true,
            grade: true,
            students: { select: { id: true } } // Count students
          }
        },
        sections: {
          select: {
            id: true,
            name: true,
            class: { select: { name: true, grade: true } }
          }
        }
      }
    });
  }

  // Create teacher (creates User + Teacher)
  @Post()
  @CanCreate(PermissionResource.TEACHERS)
  @CheckTeacherLimit()
  async create(@Body() createTeacherDto: any, @Request() req) {
    // First create user account
    const userResult = await this.authService.createUser({
      firstName: createTeacherDto.firstName,
      lastName: createTeacherDto.lastName,
      email: createTeacherDto.email,
      phone: createTeacherDto.phone,
      role: 'TEACHER' as any,
      branchId: createTeacherDto.branchId
    }, req.user.sub);

    // Then create teacher profile
    const teacher = await this.prisma.teacher.create({
      data: {
        schoolId: req.user.schoolId,
        branchId: createTeacherDto.branchId,
        departmentId: createTeacherDto.departmentId, // Optional for colleges
        userId: userResult.userId,
        employeeId: createTeacherDto.employeeId,
        subject: createTeacherDto.subject,
        qualification: createTeacherDto.qualification,
        experience: createTeacherDto.experience,
        salary: createTeacherDto.salary,
        joinDate: createTeacherDto.joinDate ? new Date(createTeacherDto.joinDate) : new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        department: { select: { id: true, name: true } }
      }
    });

    return {
      message: 'Teacher created successfully',
      teacher
    };
  }

  // Update teacher
  @Put(':id')
  @CanManage(PermissionResource.TEACHERS)
  async update(@Param('id') id: string, @Body() updateTeacherDto: any, @Request() req) {
    // Update user info if provided
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, schoolId: req.user.schoolId },
      include: { user: true }
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Update user table
    if (updateTeacherDto.firstName || updateTeacherDto.lastName || updateTeacherDto.email || updateTeacherDto.phone) {
      await this.prisma.user.update({
        where: { id: teacher.userId },
        data: {
          firstName: updateTeacherDto.firstName || teacher.user.firstName,
          lastName: updateTeacherDto.lastName || teacher.user.lastName,
          email: updateTeacherDto.email || teacher.user.email,
          phone: updateTeacherDto.phone || teacher.user.phone
        }
      });
    }

    // Update teacher table
    const updatedTeacher = await this.prisma.teacher.update({
      where: { id },
      data: {
        employeeId: updateTeacherDto.employeeId,
        subject: updateTeacherDto.subject,
        qualification: updateTeacherDto.qualification,
        experience: updateTeacherDto.experience,
        salary: updateTeacherDto.salary,
        departmentId: updateTeacherDto.departmentId,
        joinDate: updateTeacherDto.joinDate ? new Date(updateTeacherDto.joinDate) : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        department: { select: { id: true, name: true } }
      }
    });

    return {
      message: 'Teacher updated successfully',
      teacher: updatedTeacher
    };
  }

  // Delete teacher
  @Delete(':id')
  @CanManage(PermissionResource.TEACHERS)
  async remove(@Param('id') id: string, @Request() req) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, schoolId: req.user.schoolId }
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Delete teacher record and deactivate user
    await this.prisma.$transaction([
      this.prisma.teacher.delete({ where: { id } }),
      this.prisma.user.update({
        where: { id: teacher.userId },
        data: { status: 'INACTIVE' }
      })
    ]);

    return { message: 'Teacher deleted successfully' };
  }

  // Get teacher's classes
  @Get(':id/classes')
  @CanRead(PermissionResource.CLASSES)
  async getClasses(@Param('id') id: string, @Request() req) {
    return this.prisma.class.findMany({
      where: {
        teacherId: id,
        schoolId: req.user.schoolId
      },
      include: {
        students: { select: { id: true, rollNumber: true, user: { select: { firstName: true, lastName: true } } } },
        sections: { select: { id: true, name: true } }
      }
    });
  }

  // Assign teacher to class
  @Post(':id/assign-class')
  @CanManage(PermissionResource.CLASSES)
  async assignClass(@Param('id') teacherId: string, @Body() assignDto: { classId: string }, @Request() req) {
    await this.prisma.class.update({
      where: { 
        id: assignDto.classId,
        schoolId: req.user.schoolId 
      },
      data: { teacherId }
    });

    return { message: 'Teacher assigned to class successfully' };
  }

  // Get teacher's schedule/timetable
  @Get(':id/schedule')
  @CanRead(PermissionResource.CLASSES)
  async getSchedule(@Param('id') id: string, @Request() req) {
    // This would integrate with a timetable system
    return {
      message: 'Teacher schedule - to be implemented with timetable module',
      teacherId: id
    };
  }
}
