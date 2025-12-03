import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { hash } from 'bcrypt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../common/database/prisma.service';
import { CreateUserDto, UpdateUserDto } from '../common/dto/validation.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
    });
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async create(@Body() dto: CreateUserDto) {
    const hashedPassword = await hash(dto.password, 10);
    return this.prisma.user.create({
      data: { ...dto, password: hashedPassword } as any,
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, firstName: true, lastName: true, status: true },
    });
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async remove(@Param('id') id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
