import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { CanManage, CanRead, CanCreate } from '../auth/decorators/permissions.decorator';
import { RequireExamManagement, CheckExamLimit } from '../auth/decorators/subscription.decorator';
import { PermissionResource } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Controller('exams')
@UseGuards(JwtAuthGuard, PermissionGuard, SubscriptionGuard)
export class ExamsController {
  constructor(private prisma: PrismaService) {}

  // Get all exams
  @Get()
  @CanRead(PermissionResource.EXAMS)
  async findAll(@Query() query: any, @Request() req) {
    const where: any = { schoolId: req.user.schoolId };
    
    if (query.branchId) where.branchId = query.branchId;
    if (query.classId) where.classId = query.classId;
    if (query.type) where.type = query.type;
    if (query.subject) where.subject = { contains: query.subject, mode: 'insensitive' };
    if (query.startDate && query.endDate) {
      where.examDate = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate)
      };
    }

    return this.prisma.exam.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, grade: true } },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: { select: { firstName: true, lastName: true } }
          }
        },
        results: { select: { id: true } }, // Count
        _count: { select: { results: true } }
      },
      orderBy: { examDate: 'desc' }
    });
  }

  // Get exam by ID
  @Get(':id')
  @CanRead(PermissionResource.EXAMS)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.prisma.exam.findFirst({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      include: {
        branch: { select: { id: true, name: true } },
        class: { 
          select: { 
            id: true, 
            name: true, 
            grade: true,
            students: {
              select: {
                id: true,
                rollNumber: true,
                user: { select: { firstName: true, lastName: true } }
              }
            }
          } 
        },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            subject: true,
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        results: {
          select: {
            id: true,
            marksObtained: true,
            grade: true,
            student: {
              select: {
                rollNumber: true,
                user: { select: { firstName: true, lastName: true } }
              }
            }
          },
          orderBy: { marksObtained: 'desc' }
        }
      }
    });
  }

  // Create exam
  @Post()
  @CanCreate(PermissionResource.EXAMS)
  @RequireExamManagement()
  @CheckExamLimit()
  async create(@Body() createExamDto: any, @Request() req) {
    const exam = await this.prisma.exam.create({
      data: {
        schoolId: req.user.schoolId,
        branchId: createExamDto.branchId,
        classId: createExamDto.classId,
        name: createExamDto.name,
        type: createExamDto.type,
        subject: createExamDto.subject,
        totalMarks: createExamDto.totalMarks,
        passingMarks: createExamDto.passingMarks,
        examDate: new Date(createExamDto.examDate),
        duration: createExamDto.duration,
        teacherId: createExamDto.teacherId
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        teacher: {
          select: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return {
      message: 'Exam created successfully',
      exam
    };
  }

  // Update exam
  @Put(':id')
  @CanManage(PermissionResource.EXAMS)
  async update(@Param('id') id: string, @Body() updateExamDto: any, @Request() req) {
    // Check if exam has results
    const resultsCount = await this.prisma.result.count({
      where: { examId: id, schoolId: req.user.schoolId }
    });

    if (resultsCount > 0 && (updateExamDto.totalMarks || updateExamDto.passingMarks)) {
      throw new Error('Cannot modify marks for exam with existing results');
    }

    const updatedExam = await this.prisma.exam.update({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      data: {
        name: updateExamDto.name,
        type: updateExamDto.type,
        subject: updateExamDto.subject,
        totalMarks: updateExamDto.totalMarks,
        passingMarks: updateExamDto.passingMarks,
        examDate: updateExamDto.examDate ? new Date(updateExamDto.examDate) : undefined,
        duration: updateExamDto.duration,
        teacherId: updateExamDto.teacherId
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        teacher: {
          select: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return {
      message: 'Exam updated successfully',
      exam: updatedExam
    };
  }

  // Delete exam
  @Delete(':id')
  @CanManage(PermissionResource.EXAMS)
  async remove(@Param('id') id: string, @Request() req) {
    // Check if exam has results
    const resultsCount = await this.prisma.result.count({
      where: { examId: id, schoolId: req.user.schoolId }
    });

    if (resultsCount > 0) {
      throw new Error(`Cannot delete exam. It has ${resultsCount} results recorded.`);
    }

    await this.prisma.exam.delete({
      where: { 
        id,
        schoolId: req.user.schoolId 
      }
    });

    return { message: 'Exam deleted successfully' };
  }

  // Get exam results
  @Get(':id/results')
  @CanRead(PermissionResource.EXAMS)
  async getResults(@Param('id') examId: string, @Request() req) {
    return this.prisma.result.findMany({
      where: {
        examId,
        schoolId: req.user.schoolId
      },
      include: {
        student: {
          select: {
            rollNumber: true,
            admissionNo: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { marksObtained: 'desc' }
    });
  }

  // Get exam statistics
  @Get(':id/statistics')
  @CanRead(PermissionResource.EXAMS)
  async getStatistics(@Param('id') examId: string, @Request() req) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId: req.user.schoolId },
      include: {
        results: { select: { marksObtained: true } },
        class: { 
          select: { 
            students: { select: { id: true } } 
          } 
        }
      }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    const results = exam.results;
    const totalStudents = exam.class.students.length;
    const appearedStudents = results.length;
    const passedStudents = results.filter(r => r.marksObtained >= exam.passingMarks).length;
    
    const marks = results.map(r => r.marksObtained);
    const average = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
    const highest = marks.length > 0 ? Math.max(...marks) : 0;
    const lowest = marks.length > 0 ? Math.min(...marks) : 0;

    return {
      examId,
      totalStudents,
      appearedStudents,
      absentStudents: totalStudents - appearedStudents,
      passedStudents,
      failedStudents: appearedStudents - passedStudents,
      passPercentage: appearedStudents > 0 ? (passedStudents / appearedStudents) * 100 : 0,
      averageMarks: Math.round(average * 100) / 100,
      highestMarks: highest,
      lowestMarks: lowest,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks
    };
  }

  // Generate result sheet
  @Get(':id/result-sheet')
  @CanRead(PermissionResource.EXAMS)
  async generateResultSheet(@Param('id') examId: string, @Request() req) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId: req.user.schoolId },
      include: {
        class: { select: { name: true, grade: true } },
        teacher: {
          select: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        results: {
          include: {
            student: {
              select: {
                rollNumber: true,
                admissionNo: true,
                user: { select: { firstName: true, lastName: true } }
              }
            }
          },
          orderBy: { student: { rollNumber: 'asc' } }
        }
      }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    return {
      examInfo: {
        name: exam.name,
        subject: exam.subject,
        type: exam.type,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        class: exam.class,
        teacher: exam.teacher
      },
      results: exam.results.map(result => ({
        rollNumber: result.student.rollNumber,
        admissionNo: result.student.admissionNo,
        studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
        marksObtained: result.marksObtained,
        grade: result.grade,
        status: result.marksObtained >= exam.passingMarks ? 'PASS' : 'FAIL',
        percentage: Math.round((result.marksObtained / exam.totalMarks) * 100 * 100) / 100
      }))
    };
  }

  // Publish results (make visible to students/parents)
  @Post(':id/publish')
  @CanManage(PermissionResource.EXAMS)
  async publishResults(@Param('id') examId: string, @Request() req) {
    // This would typically update a 'published' field in the exam
    // For now, we'll just return a success message
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId: req.user.schoolId }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // In a real implementation, you might:
    // 1. Update exam.published = true
    // 2. Send notifications to students/parents
    // 3. Generate report cards

    return {
      message: 'Exam results published successfully',
      examId,
      publishedAt: new Date()
    };
  }
}
