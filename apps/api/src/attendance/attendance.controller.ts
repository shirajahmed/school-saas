import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../common/database/prisma.service';
import { CreateAttendanceDto } from '../common/dto/validation.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER)
  async findAll(@Query('date') date?: string, @Query('sectionId') sectionId?: string) {
    const where: any = {};
    if (date) where.date = new Date(date);
    if (sectionId) where.sectionId = sectionId;

    return this.prisma.attendance.findMany({
      where,
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER)
  async findOne(@Param('id') id: string) {
    return this.prisma.attendance.findUnique({
      where: { id },
      include: { student: true, section: true },
    });
  }

  @Post()
  @Roles(UserRole.TEACHER, UserRole.BRANCH_ADMIN)
  async create(@Body() dto: CreateAttendanceDto) {
    return this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        sectionId: dto.sectionId,
        date: new Date(dto.date),
        status: dto.status,
        remarks: dto.remarks,
      } as any,
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  @Put(':id')
  @Roles(UserRole.TEACHER, UserRole.BRANCH_ADMIN)
  async update(@Param('id') id: string, @Body() dto: Partial<CreateAttendanceDto>) {
    const data = dto.date ? { ...dto, date: new Date(dto.date) } : dto;
    return this.prisma.attendance.update({
      where: { id },
      data,
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  @Delete(':id')
  @Roles(UserRole.BRANCH_ADMIN, UserRole.SCHOOL_ADMIN)
  async remove(@Param('id') id: string) {
    return this.prisma.attendance.delete({ where: { id } });
  }
}
