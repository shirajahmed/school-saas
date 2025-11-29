import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../common/database/prisma.service';
import { CreateClassDto } from '../common/dto/validation.dto';

@Controller('classes')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER)
  async findAll() {
    return this.prisma.class.findMany({
      include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER)
  async findOne(@Param('id') id: string) {
    return this.prisma.class.findUnique({
      where: { id },
      include: { teacher: true, students: true, sections: true },
    });
  }

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async create(@Body() dto: CreateClassDto) {
    return this.prisma.class.create({
      data: {
        branchId: dto.branchId,
        name: dto.name,
        grade: dto.grade,
        teacherId: dto.teacherId,
      } as any,
      include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  @Put(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async update(@Param('id') id: string, @Body() dto: Partial<CreateClassDto>) {
    return this.prisma.class.update({
      where: { id },
      data: dto,
      include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async remove(@Param('id') id: string) {
    return this.prisma.class.delete({ where: { id } });
  }
}
