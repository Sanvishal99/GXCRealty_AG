import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class CompanyInviteService {
  constructor(private prisma: PrismaService) {}

  async createInvite(adminId: string, email?: string, note?: string) {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.companyInvite.create({
      data: {
        token,
        email,
        note,
        createdBy: adminId,
        expiresAt,
      },
    });
  }

  async listInvites() {
    return this.prisma.companyInvite.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateInvite(token: string) {
    const invite = await this.prisma.companyInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new BadRequestException('Invalid invite token');
    }
    if (invite.usedAt) {
      throw new BadRequestException('Invite has already been used');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    // Only return the minimum needed by the registration form — no admin metadata
    return {
      valid: true,
      email: invite.email ?? null,
      expiresAt: invite.expiresAt,
    };
  }

  async markUsed(token: string, userId: string) {
    return this.prisma.companyInvite.update({
      where: { token },
      data: {
        usedAt: new Date(),
        usedBy: userId,
      },
    });
  }

  async deleteInvite(id: string) {
    return this.prisma.companyInvite.delete({ where: { id } });
  }
}
