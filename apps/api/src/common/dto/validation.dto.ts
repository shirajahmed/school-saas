import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsInt, Min, IsDateString, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserRole, { each: true })
  roles: UserRole[];

  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class CreateStudentDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  branchId: string;

  @IsString()
  rollNumber: string;

  @IsString()
  admissionNo: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

export class CreateClassDto {
  @IsUUID()
  branchId: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  grade: number;

  @IsOptional()
  @IsUUID()
  teacherId?: string;
}

export class CreateAttendanceDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  sectionId: string;

  @IsDateString()
  date: string;

  @IsEnum(['PRESENT', 'ABSENT', 'LATE'])
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
