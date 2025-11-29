import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, TokenPair } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }
}
