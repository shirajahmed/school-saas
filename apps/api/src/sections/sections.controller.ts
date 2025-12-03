import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CanManage, CanRead, CanCreate } from '../auth/decorators/permissions.decorator';
import { PermissionResource } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Controller('sections')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SectionsController {
  constructor(private prisma: PrismaService) {}

  // Get all sections
  @Get()
  @CanRead(PermissionResource.CLASSES)
  async findAll(@Query() query: any, @Request() req) {
    const where: any = { schoolId: req.user.schoolId };
    
    if (query.branchId) where.branchId = query.branchId;
    if (query.classId) where.classId = query.classId;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return this.prisma.section.findMany({
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
        students: {
          select: {
            id: true,
            rollNumber: true,
            user: { select: { firstName: true, lastName: true } }
          }
        },
        _count: { select: { students: true } }
      },
      orderBy: [{ class: { grade: 'asc' } }, { name: 'asc' }]
    });
  }

  // Get section by ID
  @Get(':id')
  @CanRead(PermissionResource.CLASSES)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.prisma.section.findFirst({
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
            teacher: {
              select: {
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
        students: {
          select: {
            id: true,
            rollNumber: true,
            admissionNo: true,
            user: { select: { firstName: true, lastName: true, email: true } }
          },
          orderBy: { rollNumber: 'asc' }
        }
      }
    });
  }

  // Create section
  @Post()
  @CanCreate(PermissionResource.CLASSES)
  async create(@Body() createSectionDto: any, @Request() req) {
    const section = await this.prisma.section.create({
      data: {
        schoolId: req.user.schoolId,
        branchId: createSectionDto.branchId,
        classId: createSectionDto.classId,
        name: createSectionDto.name,
        capacity: createSectionDto.capacity,
        teacherId: createSectionDto.teacherId
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
      message: 'Section created successfully',
      section
    };
  }

  // Update section
  @Put(':id')
  @CanManage(PermissionResource.CLASSES)
  async update(@Param('id') id: string, @Body() updateSectionDto: any, @Request() req) {
    const updatedSection = await this.prisma.section.update({
      where: { 
        id,
        schoolId: req.user.schoolId 
      },
      data: {
        name: updateSectionDto.name,
        capacity: updateSectionDto.capacity,
        teacherId: updateSectionDto.teacherId
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
      message: 'Section updated successfully',
      section: updatedSection
    };
  }

  // Delete section
  @Delete(':id')
  @CanManage(PermissionResource.CLASSES)
  async remove(@Param('id') id: string, @Request() req) {
    // Check if section has students
    const studentsCount = await this.prisma.student.count({
      where: { sectionId: id, schoolId: req.user.schoolId }
    });

    if (studentsCount > 0) {
      throw new Error(`Cannot delete section. It has ${studentsCount} students assigned.`);
    }

    await this.prisma.section.delete({
      where: { 
        id,
        schoolId: req.user.schoolId 
      }
    });

    return { message: 'Section deleted successfully' };
  }

  // Get section students
  @Get(':id/students')
  @CanRead(PermissionResource.STUDENTS)
  async getStudents(@Param('id') id: string, @Request() req) {
    return this.prisma.student.findMany({
      where: {
        sectionId: id,
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
        }
      },
      orderBy: { rollNumber: 'asc' }
    });
  }

  // Assign students to section
  @Post(':id/assign-students')
  @CanManage(PermissionResource.STUDENTS)
  async assignStudents(@Param('id') sectionId: string, @Body() assignDto: { studentIds: string[] }, @Request() req) {
    // Check section capacity
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, schoolId: req.user.schoolId },
      include: { _count: { select: { students: true } } }
    });

    if (!section) {
      throw new Error('Section not found');
    }

    const newStudentCount = section._count.students + assignDto.studentIds.length;
    if (section.capacity && newStudentCount > section.capacity) {
      throw new Error(`Section capacity exceeded. Current: ${section._count.students}, Capacity: ${section.capacity}`);
    }

    // Assign students to section
    await this.prisma.student.updateMany({
      where: {
        id: { in: assignDto.studentIds },
        schoolId: req.user.schoolId
      },
      data: { sectionId }
    });

    return { 
      message: `${assignDto.studentIds.length} students assigned to section successfully`,
      assignedCount: assignDto.studentIds.length
    };
  }

  // Remove student from section
  @Delete(':id/remove-student/:studentId')
  @CanManage(PermissionResource.STUDENTS)
  async removeStudent(@Param('id') sectionId: string, @Param('studentId') studentId: string, @Request() req) {
    await this.prisma.student.update({
      where: { 
        id: studentId,
        sectionId,
        schoolId: req.user.schoolId 
      },
      data: { sectionId: null }
    });

    return { message: 'Student removed from section successfully' };
  }

  // Get section attendance summary
  @Get(':id/attendance-summary')
  @CanRead(PermissionResource.ATTENDANCE)
  async getAttendanceSummary(@Param('id') sectionId: string, @Query() query: any, @Request() req) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const attendance = await this.prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: {
        sectionId,
        schoolId: req.user.schoolId,
        date: { gte: startDate, lte: endDate }
      },
      _count: { status: true }
    });

    return {
      sectionId,
      period: { startDate, endDate },
      summary: attendance
    };
  }
}
