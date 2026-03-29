import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface PayoutDetails {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountName?: string;
  upiId?: string;
}

@Injectable()
export class WithdrawalService {
  constructor(private prisma: PrismaService) {}

  async requestWithdrawal(userId: string, amount: number, payoutDetails: PayoutDetails) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than zero');
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const existing = await this.prisma.withdrawalRequest.findFirst({
      where: { userId, status: WithdrawalStatus.PENDING },
    });
    if (existing) {
      throw new BadRequestException('You already have a pending withdrawal request');
    }

    return this.prisma.withdrawalRequest.create({
      data: {
        userId,
        amount,
        status: WithdrawalStatus.PENDING,
        bankName: payoutDetails.bankName,
        accountNumber: payoutDetails.accountNumber,
        ifscCode: payoutDetails.ifscCode,
        accountName: payoutDetails.accountName,
        upiId: payoutDetails.upiId,
      },
    });
  }

  async getMyRequests(userId: string) {
    return this.prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRequests(status?: WithdrawalStatus) {
    return this.prisma.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: { email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processRequest(
    requestId: string,
    adminId: string,
    action: 'APPROVE' | 'REJECT' | 'PAY',
    adminNote?: string,
  ) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (action === 'APPROVE') {
      if (request.status !== WithdrawalStatus.PENDING) {
        throw new BadRequestException('Only PENDING requests can be approved');
      }
      return this.prisma.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: WithdrawalStatus.APPROVED,
          processedBy: adminId,
          processedAt: new Date(),
          ...(adminNote ? { adminNote } : {}),
        },
      });
    }

    if (action === 'REJECT') {
      if (request.status !== WithdrawalStatus.PENDING) {
        throw new BadRequestException('Only PENDING requests can be rejected');
      }
      return this.prisma.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: WithdrawalStatus.REJECTED,
          adminNote: adminNote ?? null,
          processedBy: adminId,
          processedAt: new Date(),
        },
      });
    }

    if (action === 'PAY') {
      if (request.status !== WithdrawalStatus.APPROVED) {
        throw new BadRequestException('Only APPROVED requests can be marked as PAID');
      }

      const wallet = await this.prisma.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) {
        throw new NotFoundException('User wallet not found');
      }
      if (wallet.balance < request.amount) {
        throw new BadRequestException('Insufficient wallet balance to process payment');
      }

      return this.prisma.$transaction(async (prisma) => {
        await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            amount: request.amount,
            type: 'DEBIT',
            dealId: null,
            description: `Withdrawal payout — request #${request.id}`,
          },
        });

        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: request.amount } },
        });

        return prisma.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: WithdrawalStatus.PAID,
            processedBy: adminId,
            processedAt: new Date(),
            ...(adminNote ? { adminNote } : {}),
          },
        });
      });
    }

    throw new BadRequestException('Invalid action');
  }
}
