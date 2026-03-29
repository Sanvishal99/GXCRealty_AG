import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async submitKyc(userId: string, data: { aadhaarNumber: string, panNumber: string, selfieUrl: string }) {
    const existingKyc = await this.prisma.kyc.findUnique({ where: { userId } });
    if (existingKyc) throw new BadRequestException('KYC already submitted. Await verification.');

    return this.prisma.kyc.create({
      data: {
        userId,
        aadhaarNumber: data.aadhaarNumber,
        panNumber: data.panNumber,
        selfieUrl: data.selfieUrl,
      }
    });
  }

  async verifyKyc(userId: string, isVerified: boolean, rejectionReason?: string) {
    const userKyc = await this.prisma.kyc.findUnique({ where: { userId } });
    if (!userKyc) throw new NotFoundException('KYC submission not found for this user');

    const updatedKyc = await this.prisma.kyc.update({
      where: { userId },
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        rejectionReason: !isVerified ? (rejectionReason || null) : null,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: isVerified ? 'ACTIVE' : 'PENDING_KYC' },
    });

    return updatedKyc;
  }
}
