import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { SchoolSignupDto, LoginDto, CreateUserDto, SetupAccountDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 1. Public School Signup
  @Post('school-signup')
  @HttpCode(HttpStatus.CREATED)
  async schoolSignup(@Body() dto: SchoolSignupDto) {
    return this.authService.schoolSignup(dto);
  }

  // 2. Universal Login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // 3. Admin Creates Users (Protected)
  @Post('create-user')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto, @Request() req) {
    return this.authService.createUser(dto, req.user.sub);
  }

  // 4. Complete Onboarding (School Admin)
  @Post('complete-onboarding')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(@Body() dto: SetupAccountDto) {
    return this.authService.completeOnboarding(dto);
  }

  // 5. User Account Setup (Public with token)
  @Post('setup-account')
  @HttpCode(HttpStatus.OK)
  async setupAccount(@Body() dto: SetupAccountDto) {
    return this.authService.setupAccount(dto);
  }

  // 5. Forgot Password (Public)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // 6. Reset Password (Public)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // 7. Refresh Token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }
}
