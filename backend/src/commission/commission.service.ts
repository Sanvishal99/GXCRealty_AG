import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class CommissionService {
  constructor(
    private usersService: UsersService,
    private walletService: WalletService,
    private configService: ConfigService,
  ) {}

  async distributeCommission(
    dealId: string,
    closingAgentId: string,
    companyId: string,
    totalSalePrice: number,
    totalCommissionRate: number,
  ) {
    const splits = await this.configService.getCommissionSplits();
    const tierSplits = splits.tierSplits;

    const commissionPool = totalSalePrice * totalCommissionRate;

    // 1. Agent share
    const agentShare = commissionPool * splits.agentSplitPct;
    await this.walletService.addFunds(
      closingAgentId,
      agentShare,
      dealId,
      `Closing Agent Commission for Deal ${dealId}`,
    );

    // 2. Company fixed share
    const companyShare = commissionPool * splits.companySplitPct;
    await this.walletService.addFunds(
      companyId,
      companyShare,
      dealId,
      `Company Fixed Share for Deal ${dealId}`,
    );

    // 3. Network/upline share distributed across tiers
    const networkPool = commissionPool * splits.networkPoolPct;
    const uplines = await this.usersService.getUpline(closingAgentId, tierSplits.length);
    let distributedUplineShare = 0;

    for (let i = 0; i < uplines.length; i++) {
      if (i >= tierSplits.length) break;
      const uplineShare = networkPool * tierSplits[i];
      await this.walletService.addFunds(
        uplines[i].id,
        uplineShare,
        dealId,
        `Level ${i + 1} Network Override for Deal ${dealId}`,
      );
      distributedUplineShare += uplineShare;
    }

    // Residual network pool goes back to company if upline chain is shorter than tier count
    const residual = networkPool - distributedUplineShare;
    if (residual > 0.01) {
      await this.walletService.addFunds(
        companyId,
        residual,
        dealId,
        `Unclaimed Network Residue for Deal ${dealId}`,
      );
    }

    return {
      commissionPool,
      agentShare,
      companyShare,
      networkPool,
      distributedUplineShare,
      residual: residual > 0.01 ? residual : 0,
    };
  }
}
