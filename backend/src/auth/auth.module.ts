import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { CompanyInviteModule } from '../company-invite/company-invite.module';
import { MailerService } from './mailer.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
    }),
    CompanyInviteModule,
    PrismaModule,
  ],
  providers: [AuthService, JwtStrategy, MailerService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
