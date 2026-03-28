import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByInviteCode(inviteCode: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { inviteCode } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  // Find up to 5 levels of upline for commission distribution
  async getUpline(userId: string): Promise<User[]> {
    const upline: User[] = [];
    let currentId = userId;

    for (let i = 0; i < 5; i++) {
        const user = await this.prisma.user.findUnique({
             where: { id: currentId },
             include: { referredBy: true }
        });

        if (!user || !user.referredBy) break;
        
        upline.push(user.referredBy);
        currentId = user.referredBy.id;
    }

    return upline;
  }
}
