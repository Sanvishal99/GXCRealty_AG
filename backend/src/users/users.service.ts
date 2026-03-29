import { Injectable } from '@nestjs/common';
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

  async updateStatus(userId: string, status: Status) {
    return this.prisma.user.update({ where: { id: userId }, data: { status } });
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
