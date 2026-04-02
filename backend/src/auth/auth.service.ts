import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CompanyInviteService } from '../company-invite/company-invite.service';
import { MailerService } from './mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Role, Status } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private companyInviteService: CompanyInviteService,
    private mailerService: MailerService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(data: any) {
    const { email, password, phone, referralCode } = data;
    
    // Check referral logic (MLM)
    let referredById = null;
    if (referralCode) {
      const referrer = await this.usersService.findByInviteCode(referralCode);
      if (!referrer) throw new BadRequestException('Invalid referral code');
      referredById = referrer.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate an 8-character invite code for this user
    const inviteCode = uuidv4().split('-')[0].toUpperCase();

    const newUser = await this.usersService.create({
      email,
      phone,
      passwordHash: hashedPassword,
      inviteCode,
      referredBy: referredById ? { connect: { id: referredById } } : undefined,
    });

    return this.login(newUser);
  }

  async validateInviteCode(code: string) {
    const referrer = await this.usersService.findByInviteCode(code.toUpperCase());
    if (!referrer) throw new BadRequestException('Invalid invite code');
    return {
      valid: true,
      referrerEmail: referrer.email,
      referrerName: referrer.email.split('@')[0],
      code: referrer.inviteCode,
    };
  }

  async registerCompany(token: string, data: { email: string; password: string; phone: string; companyName?: string }) {
    await this.companyInviteService.validateInvite(token);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const inviteCode = uuidv4().split('-')[0].toUpperCase();

    const newUser = await this.usersService.create({
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
      inviteCode,
      role: Role.COMPANY,
      status: Status.PENDING_APPROVAL,
    });

    await this.companyInviteService.markUsed(token, newUser.id);

    return this.login(newUser);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOne(email.toLowerCase().trim());
    // Always return success to avoid user enumeration
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    await this.mailerService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Reset link is invalid or has expired.');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });
  }
}
