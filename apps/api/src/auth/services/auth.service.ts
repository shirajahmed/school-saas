import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { PrismaService } from '../../common/database/prisma.service';
import { TokenService } from './token.service';
import { JwtPayload, TokenPair } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        roles: true,
        schoolId: true,
        branchId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      schoolId: user.schoolId,
      branchId: user.branchId,
    };

    return this.tokenService.generateTokenPair(payload);
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.tokenService.verifyToken(refreshToken);
      
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          roles: true,
          schoolId: true,
          branchId: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        userId: user.id,
        email: user.email,
        roles: user.roles,
        schoolId: user.schoolId,
        branchId: user.branchId,
      };

      return this.tokenService.generateTokenPair(newPayload);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
