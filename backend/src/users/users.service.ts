import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, Role, Status } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByInviteCode(inviteCode: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { inviteCode } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async adminCreateUser(data: {
    email: string;
    phone: string;
    password: string;
    role: Role;
    status: Status;
    referralCode?: string;
  }) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });
    if (existing) {
      throw new Error(existing.email === data.email ? 'Email already in use' : 'Phone already in use');
    }

    let referredById: string | undefined;
    if (data.referralCode) {
      const referrer = await this.findByInviteCode(data.referralCode);
      if (!referrer) throw new Error('Invalid referral code');
      referredById = referrer.id;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const { v4: uuidv4 } = await import('uuid');
    const inviteCode = uuidv4().split('-')[0].toUpperCase();

    return this.prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
        status: data.status,
        inviteCode,
        ...(referredById ? { referredBy: { connect: { id: referredById } } } : {}),
      },
    });
  }

  async findAll(filters?: { role?: Role; status?: Status }) {
    return this.prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        inviteCode: true,
        referredById: true,
        createdAt: true,
        updatedAt: true,
        kyc: { select: { isVerified: true, verifiedAt: true } },
        wallet: { select: { balance: true, currency: true } },
        _count: { select: { upline: true, dealsClosed: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdFull(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        inviteCode: true,
        referredById: true,
        createdAt: true,
        updatedAt: true,
        kyc: {
          select: {
            isVerified: true,
            verifiedAt: true,
            rejectionReason: true,
            aadhaarNumber: true,
            panNumber: true,
            bankName: true,
            accountNumber: true,
            ifscCode: true,
            accountName: true,
            idFrontUrl: true,
            idBackUrl: true,
            addressDocUrl: true,
            selfieUrl: true,
          },
        },
        wallet: { select: { balance: true, currency: true } },
        _count: {
          select: { upline: true, dealsClosed: true, leads: true, agentVisits: true },
        },
      },
    });
  }

  async updateStatus(userId: string, status: Status) {
    return this.prisma.user.update({ where: { id: userId }, data: { status } });
  }

  async resetPassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  // Walk up the referral tree up to maxLevels deep
  async getUpline(userId: string, maxLevels = 5): Promise<User[]> {
    const upline: User[] = [];
    let currentId = userId;

    for (let i = 0; i < maxLevels; i++) {
      const user = await this.prisma.user.findUnique({
        where: { id: currentId },
        include: { referredBy: true },
      });
      if (!user?.referredBy) break;
      upline.push(user.referredBy);
      currentId = user.referredBy.id;
    }

    return upline;
  }

  // Walk down the referral tree for downline stats
  async getDownline(userId: string) {
    return this.prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { upline: true, dealsClosed: true } },
      },
    });
  }
}
