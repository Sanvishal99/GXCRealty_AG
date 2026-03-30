import { Controller, Post, Get, Param, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('register-company')
  async registerCompany(@Body() body: any) {
    const { token, ...data } = body;
    return this.authService.registerCompany(token, data);
  }

  /** Public: validate an agent invite code and return referrer info */
  @Get('invite/:code')
  async validateInvite(@Param('code') code: string) {
    return this.authService.validateInviteCode(code);
  }
}
