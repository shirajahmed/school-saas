import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';
import { SchoolSignupDto, LoginDto, CreateUserDto, SetupAccountDto } from '../dto/auth.dto';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 1. School Signup (Public) - Creates school + admin
  async schoolSignup(dto: SchoolSignupDto) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create school
      const school = await tx.school.create({
        data: {
          name: dto.schoolName,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
        }
      });

      // Create default branch
      const branch = await tx.branch.create({
        data: {
          schoolId: school.id,
          name: 'Main Branch',
          isDefault: true,
        }
      });

      // Create school admin
      const user = await tx.user.create({
        data: {
          schoolId: school.id,
          branchId: branch.id,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.SCHOOL_ADMIN,
          status: UserStatus.PENDING, // Needs onboarding
        }
      });

      return { school, user, branch };
    });

    // TODO: Send onboarding email/SMS

    return {
      message: 'School registered successfully. Check email for onboarding steps.',
      schoolId: result.school.id,
      userId: result.user.id
    };
  }

  // 2. Login (All users)
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.identifier },
          { phone: dto.identifier }
        ]
      },
      include: {
        school: true,
        branch: true
      }
    });

    if (!user || !user.password || !await bcrypt.compare(dto.password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Account not activated. Complete setup first.');
    }

    if (!user.school.isActive) {
      throw new ForbiddenException('School account is suspended');
    }

    // Check onboarding for school admin
    if (user.role === UserRole.SCHOOL_ADMIN && !user.school.onboarded) {
      throw new ForbiddenException('Complete school onboarding first');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    return this.generateTokens(user);
  }

  // 3. Create User (Admin only)
  async createUser(dto: CreateUserDto, adminUserId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      include: { school: true }
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    // Role-based permissions
    this.validateUserCreationPermissions(admin.role, dto.role);

    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Generate setup token
    const setupToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          schoolId: admin.schoolId,
          branchId: dto.branchId || admin.branchId,
          email: dto.email,
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
          status: UserStatus.PENDING,
        }
      });

      // Create setup token
      await tx.userToken.create({
        data: {
          userId: user.id,
          token: setupToken,
          type: 'SETUP',
          expiresAt: tokenExpiry,
        }
      });

      // Auto-create parent for student
      if (dto.role === UserRole.STUDENT && dto.phone) {
        await this.createParentAccount(tx, user.id, dto.phone, admin.schoolId, admin.branchId);
      }

      return user;
    });

    // TODO: Send setup email/SMS with token

    return {
      message: 'User created successfully. Setup instructions sent.',
      userId: result.id,
      setupToken // Remove in production, send via email/SMS
    };
  }

  // 4. Setup Account (Complete profile)
  async setupAccount(dto: SetupAccountDto) {
    const tokenRecord = await this.prisma.userToken.findUnique({
      where: { token: dto.token },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired setup token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: {
          password: hashedPassword,
          phone: dto.phone || tokenRecord.user.phone,
          status: UserStatus.ACTIVE,
        }
      });

      // Mark token as used
      await tx.userToken.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true }
      });
    });

    return { message: 'Account setup completed successfully' };
  }

  // 5. Refresh Token
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { school: true, branch: true }
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Helper: Generate JWT tokens
  private generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      branchId: user.branchId,
      permissions: this.getPermissions(user.role)
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.schoolId,
        branchId: user.branchId,
      }
    };
  }

  // Helper: Role-based permissions
  private validateUserCreationPermissions(adminRole: UserRole, targetRole: UserRole) {
    const permissions = {
      [UserRole.SUPER_ADMIN]: [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN],
      [UserRole.SCHOOL_ADMIN]: [UserRole.BRANCH_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
      [UserRole.BRANCH_ADMIN]: [UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    };

    if (!permissions[adminRole]?.includes(targetRole)) {
      throw new ForbiddenException(`${adminRole} cannot create ${targetRole}`);
    }
  }

  // Helper: Get role permissions
  private getPermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.SUPER_ADMIN]: ['*'],
      [UserRole.SCHOOL_ADMIN]: ['school:*', 'branch:*', 'user:*', 'student:*', 'teacher:*'],
      [UserRole.BRANCH_ADMIN]: ['branch:read', 'user:create', 'student:*', 'teacher:*'],
      [UserRole.TEACHER]: ['student:read', 'class:*', 'attendance:*', 'exam:*'],
      [UserRole.STUDENT]: ['profile:read', 'attendance:read', 'result:read'],
      [UserRole.PARENT]: ['student:read', 'attendance:read', 'result:read'],
    };

    return permissions[role] || [];
  }

  // Helper: Auto-create parent account
  private async createParentAccount(tx: any, studentUserId: string, parentPhone: string, schoolId: string, branchId: string) {
    const parentEmail = `parent.${studentUserId}@temp.com`; // Temporary email
    
    const parent = await tx.user.create({
      data: {
        schoolId,
        branchId,
        email: parentEmail,
        phone: parentPhone,
        firstName: 'Parent',
        lastName: 'Account',
        role: UserRole.PARENT,
        status: UserStatus.PENDING,
      }
    });

    // Link parent to student
    await tx.student.update({
      where: { userId: studentUserId },
      data: { parentUserId: parent.id }
    });

    return parent;
  }
}
