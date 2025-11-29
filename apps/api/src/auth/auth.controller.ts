import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { TokenPair } from './interfaces/jwt-payload.interface';

class LoginDto {
  email: string;
  password: string;
}

class RefreshTokenDto {
  refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<TokenPair> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenPair> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
