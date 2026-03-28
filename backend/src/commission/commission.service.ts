import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class CommissionService {
  constructor(
    private usersService: UsersService,
    private walletService: WalletService,
  ) {}

  private readonly UPLINE_SPLITS = [0.03, 0.015, 0.01, 0.01, 0.005]; // Total 7%
  private readonly COMPANY_SPLIT = 0.03; // 3%
  private readonly AGENT_SPLIT = 0.90; // 90%

  async distributeCommission(dealId: string, closingAgentId: string, companyId: string, totalSalePrice: number, totalCommissionRate: number) {
    // Total commission available (e.g. 5% of a $1M sale = $50k)
    const commissionPool = totalSalePrice * totalCommissionRate;
    
    // 1. Pay the Agent (90% of the pool)
    const agentShare = commissionPool * this.AGENT_SPLIT;
    await this.walletService.addFunds(closingAgentId, agentShare, dealId, `Closing Agent Commission for Deal ${dealId}`);

    // 2. Pay the Company (3% of the pool)
    const companyShare = commissionPool * this.COMPANY_SPLIT;
    await this.walletService.addFunds(companyId, companyShare, dealId, `Company Fixed Share for Deal ${dealId}`);

    // 3. Pay the Upline (7% of the pool splits across 5 levels)
    const uplines = await this.usersService.getUpline(closingAgentId);
    
    // We iterate up to 5 levels. If the upline is shorter than 5, the remaining unallocated % will fall back to company.
    let distributedUplineShare = 0;

    for (let i = 0; i < uplines.length; i++) {
        if (i >= 5) break; 
        
        const splitRate = this.UPLINE_SPLITS[i];
        const uplineShare = commissionPool * splitRate;
        
        await this.walletService.addFunds(
           uplines[i].id, 
           uplineShare, 
           dealId, 
           `Level ${i + 1} Upline Commission for Deal ${dealId}`
        );
        distributedUplineShare += uplineShare;
    }

    // Give residue back to Company if agent has < 5 levels of upline
    const expectedUplineTotal = commissionPool * 0.07;
    const residual = expectedUplineTotal - distributedUplineShare;
    
    if (residual > 0) {
        await this.walletService.addFunds(
            companyId, 
            residual, 
            dealId, 
            `Unclaimed Upline Residue for Deal ${dealId}`
        );
    }
  }
}
