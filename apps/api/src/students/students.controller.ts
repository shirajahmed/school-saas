import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { CanManage, CanRead, CanCreate } from '../auth/decorators/permissions.decorator';
import { CheckStudentLimit } from '../auth/decorators/subscription.decorator';
import { PermissionResource } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { AuthService } from '../auth/services/auth.service';

@Controller('students')
@UseGuards(JwtAuthGuard, PermissionGuard, SubscriptionGuard)
export class StudentsController {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  // Get all students
  @Get()
  @CanRead(PermissionResource.STUDENTS)
  async findAll(@Query() query: any, @Request() req) {
    const where: any = { schoolId: req.user.schoolId };
    
    if (query.branchId) where.branchId = query.branchId;
    if (query.classId) where.classId = query.classId;
    if (query.search) {
      where.OR = [
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { rollNumber: { contains: query.search, mode: 'insensitive' } },
        { admissionNo: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.student.findMany({
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
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } }
      },
      orderBy: { rollNumber: 'asc' }
    });
  }

  // Get student by ID
  @Get(':id')
  @CanRead(PermissionResource.STUDENTS)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.prisma.student.findFirst({
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
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
        attendance: {
          take: 10,
          orderBy: { date: 'desc' },
          select: { date: true, status: true }
        },
        results: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            exam: { select: { name: true, subject: true, totalMarks: true } }
          }
        }
      }
    });
  }

  // Create student (creates User + Student)
  @Post()
  @CanCreate(PermissionResource.STUDENTS)
  @CheckStudentLimit()
  async create(@Body() createStudentDto: any, @Request() req) {
    // First create user account
    const userResult = await this.authService.createUser({
      firstName: createStudentDto.firstName,
      lastName: createStudentDto.lastName,
      email: createStudentDto.email,
      phone: createStudentDto.phone,
      role: 'STUDENT' as any,
      branchId: createStudentDto.branchId
    }, req.user.sub);

    // Then create student profile
    const student = await this.prisma.student.create({
      data: {
        schoolId: req.user.schoolId,
        branchId: createStudentDto.branchId,
        userId: userResult.userId,
        rollNumber: createStudentDto.rollNumber,
        admissionNo: createStudentDto.admissionNo,
        dateOfBirth: createStudentDto.dateOfBirth ? new Date(createStudentDto.dateOfBirth) : null,
        gender: createStudentDto.gender,
        address: createStudentDto.address,
        parentPhone: createStudentDto.parentPhone,
        parentEmail: createStudentDto.parentEmail,
        classId: createStudentDto.classId,
        sectionId: createStudentDto.sectionId
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
        }
      }
    });

    // Auto-create parent if parent info provided
    if (createStudentDto.parentPhone || createStudentDto.parentEmail) {
      await this.createParentAccount(student, createStudentDto, req.user.sub);
    }

    return {
      message: 'Student created successfully',
      student
    };
  }

  // Update student
  @Put(':id')
  @CanManage(PermissionResource.STUDENTS)
  async update(@Param('id') id: string, @Body() updateStudentDto: any, @Request() req) {
    // Update user info if provided
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId: req.user.schoolId },
      include: { user: true }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Update user table
    if (updateStudentDto.firstName || updateStudentDto.lastName || updateStudentDto.email || updateStudentDto.phone) {
      await this.prisma.user.update({
        where: { id: student.userId },
        data: {
          firstName: updateStudentDto.firstName || student.user.firstName,
          lastName: updateStudentDto.lastName || student.user.lastName,
          email: updateStudentDto.email || student.user.email,
          phone: updateStudentDto.phone || student.user.phone
        }
      });
    }

    // Update student table
    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        rollNumber: updateStudentDto.rollNumber,
        admissionNo: updateStudentDto.admissionNo,
        dateOfBirth: updateStudentDto.dateOfBirth ? new Date(updateStudentDto.dateOfBirth) : undefined,
        gender: updateStudentDto.gender,
        address: updateStudentDto.address,
        parentPhone: updateStudentDto.parentPhone,
        parentEmail: updateStudentDto.parentEmail,
        classId: updateStudentDto.classId,
        sectionId: updateStudentDto.sectionId
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
        }
      }
    });

    return {
      message: 'Student updated successfully',
      student: updatedStudent
    };
  }

  // Delete student (soft delete user + remove student)
  @Delete(':id')
  @CanManage(PermissionResource.STUDENTS)
  async remove(@Param('id') id: string, @Request() req) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId: req.user.schoolId }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Delete student record and deactivate user
    await this.prisma.$transaction([
      this.prisma.student.delete({ where: { id } }),
      this.prisma.user.update({
        where: { id: student.userId },
        data: { status: 'INACTIVE' }
      })
    ]);

    return { message: 'Student deleted successfully' };
  }

  // Get student attendance
  @Get(':id/attendance')
  @CanRead(PermissionResource.ATTENDANCE)
  async getAttendance(@Param('id') id: string, @Query() query: any, @Request() req) {
    const where: any = {
      studentId: id,
      schoolId: req.user.schoolId
    };

    if (query.startDate && query.endDate) {
      where.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate)
      };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        section: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
  }

  // Get student results
  @Get(':id/results')
  @CanRead(PermissionResource.EXAMS)
  async getResults(@Param('id') id: string, @Request() req) {
    return this.prisma.result.findMany({
      where: {
        studentId: id,
        schoolId: req.user.schoolId
      },
      include: {
        exam: {
          select: {
            name: true,
            subject: true,
            totalMarks: true,
            passingMarks: true,
            examDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Helper method to create parent account
  private async createParentAccount(student: any, studentData: any, createdBy: string) {
    if (!studentData.parentEmail && !studentData.parentPhone) return;

    const parentEmail = studentData.parentEmail || `parent.${student.id}@temp.com`;
    
    try {
      const parentResult = await this.authService.createUser({
        firstName: 'Parent',
        lastName: student.user.lastName,
        email: parentEmail,
        phone: studentData.parentPhone,
        role: 'PARENT' as any,
        branchId: student.branchId
      }, createdBy);

      // Link parent to student
      await this.prisma.student.update({
        where: { id: student.id },
        data: { parentUserId: parentResult.userId }
      });

    } catch (error) {
      console.log('Parent account creation failed:', error.message);
    }
  }
}
