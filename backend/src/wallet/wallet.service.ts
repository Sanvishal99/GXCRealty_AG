import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async createWallet(userId: string) {
    return this.prisma.wallet.create({ data: { userId } });
  }

  async addFunds(userId: string, amount: number, dealId: string | null, description: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Create Transaction Ledger entry
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT',
          dealId,
          description,
        },
      });

      // 2. Update Balance
      return prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
    });
  }
}
