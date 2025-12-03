import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CanManage, CanRead, CanCreate } from '../auth/decorators/permissions.decorator';
import { PermissionResource } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AttendanceController {
  constructor(private prisma: PrismaService) {}

  // Get attendance records
  @Get()
  @CanRead(PermissionResource.ATTENDANCE)
  async findAll(@Query() query: any, @Request() req) {
    const where: any = { schoolId: req.user.schoolId };
    
    if (query.branchId) where.branchId = query.branchId;
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;
    if (query.date) where.date = new Date(query.date);
    if (query.startDate && query.endDate) {
      where.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate)
      };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            admissionNo: true,
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true, grade: true } }
          }
        },
        section: {
          select: {
            id: true,
            name: true,
            class: { select: { name: true, grade: true } }
          }
        },
        branch: { select: { id: true, name: true } }
      },
      orderBy: [{ date: 'desc' }, { student: { rollNumber: 'asc' } }]
    });
  }

  // Get attendance by ID
  @Get(':id')
  @CanRead(PermissionResource.ATTENDANCE)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.prisma.attendance.findFirst({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      include: {
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
        section: {
          select: {
            id: true,
            name: true,
            class: { select: { name: true, grade: true } },
            teacher: {
              select: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        },
        branch: { select: { id: true, name: true } }
      }
    });
  }

  // Mark attendance (single student)
  @Post()
  @CanCreate(PermissionResource.ATTENDANCE)
  async create(@Body() createAttendanceDto: any, @Request() req) {
    // Check if attendance already exists for this student and date
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId: createAttendanceDto.studentId,
        date: new Date(createAttendanceDto.date),
        schoolId: req.user.schoolId
      }
    });

    if (existingAttendance) {
      throw new Error('Attendance already marked for this student on this date');
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        schoolId: req.user.schoolId,
        branchId: createAttendanceDto.branchId,
        studentId: createAttendanceDto.studentId,
        sectionId: createAttendanceDto.sectionId,
        date: new Date(createAttendanceDto.date),
        status: createAttendanceDto.status,
        remarks: createAttendanceDto.remarks
      },
      include: {
        student: {
          select: {
            rollNumber: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return {
      message: 'Attendance marked successfully',
      attendance
    };
  }

  // Bulk mark attendance (entire class/section)
  @Post('bulk')
  @CanCreate(PermissionResource.ATTENDANCE)
  async createBulk(@Body() bulkAttendanceDto: { 
    date: string; 
    sectionId: string; 
    branchId: string;
    attendanceList: { studentId: string; status: string; remarks?: string }[] 
  }, @Request() req) {
    
    const attendanceDate = new Date(bulkAttendanceDto.date);
    
    // Check if attendance already exists for this section and date
    const existingCount = await this.prisma.attendance.count({
      where: {
        sectionId: bulkAttendanceDto.sectionId,
        date: attendanceDate,
        schoolId: req.user.schoolId
      }
    });

    if (existingCount > 0) {
      throw new Error('Attendance already marked for this section on this date');
    }

    // Prepare attendance records
    const attendanceRecords = bulkAttendanceDto.attendanceList.map(record => ({
      schoolId: req.user.schoolId,
      branchId: bulkAttendanceDto.branchId,
      studentId: record.studentId,
      sectionId: bulkAttendanceDto.sectionId,
      date: attendanceDate,
      status: record.status,
      remarks: record.remarks
    }));

    // Create all attendance records in transaction
    const results = await this.prisma.$transaction(
      attendanceRecords.map(record => 
        this.prisma.attendance.create({ data: record })
      )
    );

    return {
      message: `Attendance marked for ${results.length} students`,
      count: results.length,
      date: attendanceDate,
      sectionId: bulkAttendanceDto.sectionId
    };
  }

  // Update attendance
  @Put(':id')
  @CanManage(PermissionResource.ATTENDANCE)
  async update(@Param('id') id: string, @Body() updateAttendanceDto: any, @Request() req) {
    const updatedAttendance = await this.prisma.attendance.update({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      data: {
        status: updateAttendanceDto.status,
        remarks: updateAttendanceDto.remarks
      },
      include: {
        student: {
          select: {
            rollNumber: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return {
      message: 'Attendance updated successfully',
      attendance: updatedAttendance
    };
  }

  // Delete attendance
  @Delete(':id')
  @CanManage(PermissionResource.ATTENDANCE)
  async remove(@Param('id') id: string, @Request() req) {
    await this.prisma.attendance.delete({
      where: { 
        id,
        schoolId: req.user.schoolId 
      }
    });

    return { message: 'Attendance record deleted successfully' };
  }

  // Get section attendance for a specific date
  @Get('section/:sectionId/date/:date')
  @CanRead(PermissionResource.ATTENDANCE)
  async getSectionAttendance(@Param('sectionId') sectionId: string, @Param('date') date: string, @Request() req) {
    const attendanceDate = new Date(date);
    
    // Get all students in the section
    const students = await this.prisma.student.findMany({
      where: {
        sectionId,
        schoolId: req.user.schoolId
      },
      select: {
        id: true,
        rollNumber: true,
        admissionNo: true,
        user: { select: { firstName: true, lastName: true } }
      },
      orderBy: { rollNumber: 'asc' }
    });

    // Get attendance records for this date
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        sectionId,
        date: attendanceDate,
        schoolId: req.user.schoolId
      }
    });

    // Merge students with their attendance status
    const attendanceList = students.map(student => {
      const attendance = attendanceRecords.find(a => a.studentId === student.id);
      return {
        student,
        attendance: attendance ? {
          id: attendance.id,
          status: attendance.status,
          remarks: attendance.remarks
        } : null,
        isMarked: !!attendance
      };
    });

    return {
      sectionId,
      date: attendanceDate,
      totalStudents: students.length,
      markedCount: attendanceRecords.length,
      attendanceList
    };
  }

  // Get attendance summary for a student
  @Get('student/:studentId/summary')
  @CanRead(PermissionResource.ATTENDANCE)
  async getStudentAttendanceSummary(@Param('studentId') studentId: string, @Query() query: any, @Request() req) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const attendance = await this.prisma.attendance.findMany({
      where: {
        studentId,
        schoolId: req.user.schoolId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'desc' }
    });

    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
    const absentDays = attendance.filter(a => a.status === 'ABSENT').length;
    const lateDays = attendance.filter(a => a.status === 'LATE').length;

    return {
      studentId,
      period: { startDate, endDate },
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100 * 100) / 100 : 0
      },
      records: attendance
    };
  }

  // Get class attendance summary
  @Get('class/:classId/summary')
  @CanRead(PermissionResource.ATTENDANCE)
  async getClassAttendanceSummary(@Param('classId') classId: string, @Query() query: any, @Request() req) {
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

    // Get student details
    const students = await this.prisma.student.findMany({
      where: { classId, schoolId: req.user.schoolId },
      select: {
        id: true,
        rollNumber: true,
        user: { select: { firstName: true, lastName: true } }
      }
    });

    // Process attendance data
    const studentSummary = students.map(student => {
      const studentAttendance = attendance.filter(a => a.studentId === student.id);
      const totalDays = studentAttendance.reduce((sum, a) => sum + a._count.status, 0);
      const presentDays = studentAttendance.find(a => a.status === 'PRESENT')?._count.status || 0;
      
      return {
        student,
        totalDays,
        presentDays,
        absentDays: studentAttendance.find(a => a.status === 'ABSENT')?._count.status || 0,
        lateDays: studentAttendance.find(a => a.status === 'LATE')?._count.status || 0,
        attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100 * 100) / 100 : 0
      };
    });

    return {
      classId,
      period: { startDate, endDate },
      studentSummary: studentSummary.sort((a, b) => a.student.rollNumber.localeCompare(b.student.rollNumber))
    };
  }

  // Get daily attendance report
  @Get('daily-report/:date')
  @CanRead(PermissionResource.ATTENDANCE)
  async getDailyReport(@Param('date') date: string, @Query() query: any, @Request() req) {
    const reportDate = new Date(date);
    const where: any = {
      schoolId: req.user.schoolId,
      date: reportDate
    };

    if (query.branchId) where.branchId = query.branchId;
    if (query.sectionId) where.sectionId = query.sectionId;

    const attendance = await this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            rollNumber: true,
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true, grade: true } },
            section: { select: { name: true } }
          }
        }
      }
    });

    const summary = {
      date: reportDate,
      totalRecords: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length
    };

    return {
      summary,
      records: attendance
    };
  }
}
