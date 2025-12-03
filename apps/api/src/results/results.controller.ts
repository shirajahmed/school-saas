import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CanManage, CanRead, CanCreate } from '../auth/decorators/permissions.decorator';
import { PermissionResource } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Controller('results')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ResultsController {
  constructor(private prisma: PrismaService) {}

  // Get all results
  @Get()
  @CanRead(PermissionResource.EXAMS)
  async findAll(@Query() query: any, @Request() req) {
    const where: any = { schoolId: req.user.schoolId };
    
    if (query.examId) where.examId = query.examId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.minMarks) where.marksObtained = { gte: parseInt(query.minMarks) };
    if (query.maxMarks) where.marksObtained = { ...where.marksObtained, lte: parseInt(query.maxMarks) };

    return this.prisma.result.findMany({
      where,
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            subject: true,
            type: true,
            totalMarks: true,
            passingMarks: true,
            examDate: true
          }
        },
        student: {
          select: {
            id: true,
            rollNumber: true,
            admissionNo: true,
            user: { select: { firstName: true, lastName: true } }
          }
        },
        branch: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get result by ID
  @Get(':id')
  @CanRead(PermissionResource.EXAMS)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.prisma.result.findFirst({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            subject: true,
            type: true,
            totalMarks: true,
            passingMarks: true,
            examDate: true,
            duration: true,
            class: { select: { name: true, grade: true } }
          }
        },
        student: {
          select: {
            id: true,
            rollNumber: true,
            admissionNo: true,
            user: { select: { firstName: true, lastName: true, email: true } },
            class: { select: { name: true, grade: true } },
            section: { select: { name: true } }
          }
        },
        branch: { select: { id: true, name: true } }
      }
    });
  }

  // Create result (single)
  @Post()
  @CanCreate(PermissionResource.EXAMS)
  async create(@Body() createResultDto: any, @Request() req) {
    // Validate exam and student exist
    const exam = await this.prisma.exam.findFirst({
      where: { id: createResultDto.examId, schoolId: req.user.schoolId }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    if (createResultDto.marksObtained > exam.totalMarks) {
      throw new Error(`Marks obtained (${createResultDto.marksObtained}) cannot exceed total marks (${exam.totalMarks})`);
    }

    // Check if result already exists
    const existingResult = await this.prisma.result.findFirst({
      where: {
        examId: createResultDto.examId,
        studentId: createResultDto.studentId,
        schoolId: req.user.schoolId
      }
    });

    if (existingResult) {
      throw new Error('Result already exists for this student and exam');
    }

    // Calculate grade
    const grade = this.calculateGrade(createResultDto.marksObtained, exam.totalMarks, exam.passingMarks);

    const result = await this.prisma.result.create({
      data: {
        schoolId: req.user.schoolId,
        branchId: createResultDto.branchId,
        examId: createResultDto.examId,
        studentId: createResultDto.studentId,
        marksObtained: createResultDto.marksObtained,
        grade,
        remarks: createResultDto.remarks
      },
      include: {
        exam: {
          select: {
            name: true,
            subject: true,
            totalMarks: true,
            passingMarks: true
          }
        },
        student: {
          select: {
            rollNumber: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return {
      message: 'Result created successfully',
      result
    };
  }

  // Bulk create results
  @Post('bulk')
  @CanCreate(PermissionResource.EXAMS)
  async createBulk(@Body() bulkResultDto: { examId: string; results: any[] }, @Request() req) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: bulkResultDto.examId, schoolId: req.user.schoolId }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Validate all results
    const validatedResults = bulkResultDto.results.map(result => {
      if (result.marksObtained > exam.totalMarks) {
        throw new Error(`Marks obtained (${result.marksObtained}) cannot exceed total marks (${exam.totalMarks}) for student ${result.studentId}`);
      }

      return {
        schoolId: req.user.schoolId,
        branchId: result.branchId,
        examId: bulkResultDto.examId,
        studentId: result.studentId,
        marksObtained: result.marksObtained,
        grade: this.calculateGrade(result.marksObtained, exam.totalMarks, exam.passingMarks),
        remarks: result.remarks
      };
    });

    // Create all results in transaction
    const results = await this.prisma.$transaction(
      validatedResults.map(result => 
        this.prisma.result.create({ data: result })
      )
    );

    return {
      message: `${results.length} results created successfully`,
      count: results.length,
      examId: bulkResultDto.examId
    };
  }

  // Update result
  @Put(':id')
  @CanManage(PermissionResource.EXAMS)
  async update(@Param('id') id: string, @Body() updateResultDto: any, @Request() req) {
    const result = await this.prisma.result.findFirst({
      where: { id, schoolId: req.user.schoolId },
      include: { exam: true }
    });

    if (!result) {
      throw new Error('Result not found');
    }

    if (updateResultDto.marksObtained && updateResultDto.marksObtained > result.exam.totalMarks) {
      throw new Error(`Marks obtained (${updateResultDto.marksObtained}) cannot exceed total marks (${result.exam.totalMarks})`);
    }

    // Recalculate grade if marks changed
    const newGrade = updateResultDto.marksObtained 
      ? this.calculateGrade(updateResultDto.marksObtained, result.exam.totalMarks, result.exam.passingMarks)
      : result.grade;

    const updatedResult = await this.prisma.result.update({
      where: { id },
      data: {
        marksObtained: updateResultDto.marksObtained,
        grade: newGrade,
        remarks: updateResultDto.remarks
      },
      include: {
        exam: {
          select: {
            name: true,
            subject: true,
            totalMarks: true,
            passingMarks: true
          }
        },
        student: {
          select: {
            rollNumber: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return {
      message: 'Result updated successfully',
      result: updatedResult
    };
  }

  // Delete result
  @Delete(':id')
  @CanManage(PermissionResource.EXAMS)
  async remove(@Param('id') id: string, @Request() req) {
    await this.prisma.result.delete({
      where: { 
        id,
        schoolId: req.user.schoolId 
      }
    });

    return { message: 'Result deleted successfully' };
  }

  // Get student's all results
  @Get('student/:studentId')
  @CanRead(PermissionResource.EXAMS)
  async getStudentResults(@Param('studentId') studentId: string, @Query() query: any, @Request() req) {
    const where: any = {
      studentId,
      schoolId: req.user.schoolId
    };

    if (query.subject) {
      where.exam = { subject: { contains: query.subject, mode: 'insensitive' } };
    }

    if (query.examType) {
      where.exam = { ...where.exam, type: query.examType };
    }

    return this.prisma.result.findMany({
      where,
      include: {
        exam: {
          select: {
            name: true,
            subject: true,
            type: true,
            totalMarks: true,
            passingMarks: true,
            examDate: true
          }
        }
      },
      orderBy: { exam: { examDate: 'desc' } }
    });
  }

  // Get class performance comparison
  @Get('class/:classId/performance')
  @CanRead(PermissionResource.EXAMS)
  async getClassPerformance(@Param('classId') classId: string, @Query() query: any, @Request() req) {
    const where: any = {
      schoolId: req.user.schoolId,
      exam: { classId }
    };

    if (query.subject) {
      where.exam.subject = { contains: query.subject, mode: 'insensitive' };
    }

    const results = await this.prisma.result.findMany({
      where,
      include: {
        exam: {
          select: {
            name: true,
            subject: true,
            totalMarks: true,
            passingMarks: true
          }
        },
        student: {
          select: {
            rollNumber: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { marksObtained: 'desc' }
    });

    // Group by exam and calculate statistics
    const examStats = results.reduce((acc, result) => {
      const examId = result.examId;
      if (!acc[examId]) {
        acc[examId] = {
          exam: result.exam,
          results: [],
          stats: {}
        };
      }
      acc[examId].results.push(result);
      return acc;
    }, {});

    // Calculate statistics for each exam
    Object.keys(examStats).forEach(examId => {
      const examData = examStats[examId];
      const marks = examData.results.map(r => r.marksObtained);
      const passedCount = examData.results.filter(r => r.marksObtained >= examData.exam.passingMarks).length;
      
      examData.stats = {
        totalStudents: marks.length,
        passedStudents: passedCount,
        failedStudents: marks.length - passedCount,
        passPercentage: marks.length > 0 ? (passedCount / marks.length) * 100 : 0,
        averageMarks: marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0,
        highestMarks: marks.length > 0 ? Math.max(...marks) : 0,
        lowestMarks: marks.length > 0 ? Math.min(...marks) : 0
      };
    });

    return examStats;
  }

  // Helper method to calculate grade
  private calculateGrade(marksObtained: number, totalMarks: number, passingMarks: number): string {
    const percentage = (marksObtained / totalMarks) * 100;
    
    if (marksObtained < passingMarks) return 'F';
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'D';
  }
}
