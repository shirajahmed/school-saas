import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { CanManage, CanRead, CanCreate } from '../auth/decorators/permissions.decorator';
import { CheckClassLimit } from '../auth/decorators/subscription.decorator';
import { PermissionResource } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Controller('classes')
@UseGuards(JwtAuthGuard, PermissionGuard, SubscriptionGuard)
export class ClassesController {
  constructor(private prisma: PrismaService) {}

  // Get all classes
  @Get()
  @CanRead(PermissionResource.CLASSES)
  async findAll(@Query() query: any, @Request() req) {
    const where: any = { schoolId: req.user.schoolId };
    
    if (query.branchId) where.branchId = query.branchId;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.grade) where.grade = parseInt(query.grade);
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return this.prisma.class.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: { select: { firstName: true, lastName: true } }
          }
        },
        students: { select: { id: true } }, // Count
        sections: { select: { id: true, name: true } }
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }]
    });
  }

  // Get class by ID
  @Get(':id')
  @CanRead(PermissionResource.CLASSES)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.prisma.class.findFirst({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            subject: true,
            user: { select: { firstName: true, lastName: true, email: true, phone: true } }
          }
        },
        students: {
          select: {
            id: true,
            rollNumber: true,
            admissionNo: true,
            user: { select: { firstName: true, lastName: true } }
          },
          orderBy: { rollNumber: 'asc' }
        },
        sections: {
          select: {
            id: true,
            name: true,
            capacity: true,
            students: { select: { id: true } } // Count per section
          }
        }
      }
    });
  }

  // Create class
  @Post()
  @CanCreate(PermissionResource.CLASSES)
  @CheckClassLimit()
  async create(@Body() createClassDto: any, @Request() req) {
    const classData = await this.prisma.class.create({
      data: {
        schoolId: req.user.schoolId,
        branchId: createClassDto.branchId,
        departmentId: createClassDto.departmentId, // Optional for colleges
        name: createClassDto.name,
        grade: createClassDto.grade,
        teacherId: createClassDto.teacherId
      },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        teacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return {
      message: 'Class created successfully',
      class: classData
    };
  }

  // Update class
  @Put(':id')
  @CanManage(PermissionResource.CLASSES)
  async update(@Param('id') id: string, @Body() updateClassDto: any, @Request() req) {
    const updatedClass = await this.prisma.class.update({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      data: {
        name: updateClassDto.name,
        grade: updateClassDto.grade,
        teacherId: updateClassDto.teacherId,
        departmentId: updateClassDto.departmentId
      },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        teacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return {
      message: 'Class updated successfully',
      class: updatedClass
    };
  }

  // Delete class
  @Delete(':id')
  @CanManage(PermissionResource.CLASSES)
  async remove(@Param('id') id: string, @Request() req) {
    // Check if class has students
    const studentsCount = await this.prisma.student.count({
      where: { classId: id, schoolId: req.user.schoolId }
    });

    if (studentsCount > 0) {
      throw new Error(`Cannot delete class. It has ${studentsCount} students assigned.`);
    }

    await this.prisma.class.delete({
      where: { 
        id,
        schoolId: req.user.schoolId 
      }
    });

    return { message: 'Class deleted successfully' };
  }

  // Get class students
  @Get(':id/students')
  @CanRead(PermissionResource.STUDENTS)
  async getStudents(@Param('id') id: string, @Request() req) {
    return this.prisma.student.findMany({
      where: {
        classId: id,
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
        section: { select: { id: true, name: true } }
      },
      orderBy: { rollNumber: 'asc' }
    });
  }

  // Add student to class
  @Post(':id/add-student')
  @CanManage(PermissionResource.STUDENTS)
  async addStudent(@Param('id') classId: string, @Body() addStudentDto: { studentId: string, sectionId?: string }, @Request() req) {
    await this.prisma.student.update({
      where: { 
        id: addStudentDto.studentId,
        schoolId: req.user.schoolId 
      },
      data: { 
        classId,
        sectionId: addStudentDto.sectionId 
      }
    });

    return { message: 'Student added to class successfully' };
  }

  // Remove student from class
  @Delete(':id/remove-student/:studentId')
  @CanManage(PermissionResource.STUDENTS)
  async removeStudent(@Param('id') classId: string, @Param('studentId') studentId: string, @Request() req) {
    await this.prisma.student.update({
      where: { 
        id: studentId,
        classId,
        schoolId: req.user.schoolId 
      },
      data: { 
        classId: null,
        sectionId: null 
      }
    });

    return { message: 'Student removed from class successfully' };
  }

  // Get class attendance summary
  @Get(':id/attendance-summary')
  @CanRead(PermissionResource.ATTENDANCE)
  async getAttendanceSummary(@Param('id') classId: string, @Query() query: any, @Request() req) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const attendance = await this.prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: {
        schoolId: req.user.schoolId,
        student: { classId },
        date: { gte: startDate, lte: endDate }
      },
      _count: { status: true }
    });

    return {
      period: { startDate, endDate },
      summary: attendance
    };
  }

  // Create section for class
  @Post(':id/sections')
  @CanManage(PermissionResource.CLASSES)
  async createSection(@Param('id') classId: string, @Body() sectionDto: any, @Request() req) {
    const section = await this.prisma.section.create({
      data: {
        schoolId: req.user.schoolId,
        branchId: req.user.branchId,
        classId,
        name: sectionDto.name,
        capacity: sectionDto.capacity,
        teacherId: sectionDto.teacherId
      }
    });

    return {
      message: 'Section created successfully',
      section
    };
  }
}
