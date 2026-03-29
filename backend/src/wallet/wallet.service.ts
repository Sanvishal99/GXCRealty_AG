import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async createWallet(userId: string) {
    return this.prisma.wallet.create({ data: { userId } });
  }

  async getWalletForUser(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { deal: { select: { id: true } } },
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { deal: { select: { id: true } } },
          },
        },
      });
    }

    return wallet;
  }

  async addFunds(userId: string, amount: number, dealId: string | null, description: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.transaction.create({
        data: { walletId: wallet.id, amount, type: 'CREDIT', dealId, description },
      });
      return prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
    });
  }

  async withdraw(userId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'DEBIT',
          dealId: null,
          description: 'Withdrawal request',
        },
      });
      return prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
    });
  }
}
