import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant } from '../common/tenant/tenant.decorator';
import { PrismaService } from '../common/database/prisma.service';
import { CreateStudentDto, UpdateUserDto } from '../common/dto/validation.dto';

@Controller('students')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER)
  async findAll() {
    return this.prisma.student.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER)
  async findOne(@Param('id') id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: { user: true, class: true, section: true },
    });
  }

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async create(@Body() dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: {
        userId: dto.userId,
        branchId: dto.branchId,
        rollNumber: dto.rollNumber,
        admissionNo: dto.admissionNo,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        classId: dto.classId,
        sectionId: dto.sectionId,
      } as any,
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  @Put(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async update(@Param('id') id: string, @Body() dto: Partial<CreateStudentDto>) {
    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async remove(@Param('id') id: string) {
    return this.prisma.student.delete({ where: { id } });
  }
}
