import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  schoolId: string;
  branchId?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
