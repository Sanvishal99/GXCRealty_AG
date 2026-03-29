import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CompanyInviteService } from '../company-invite/company-invite.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Role, Status } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private companyInviteService: CompanyInviteService,
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
}
