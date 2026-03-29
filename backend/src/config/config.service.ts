import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_CONFIG = {
  id: 'DEFAULT',
  commissionPoolPct: 2.0,
  agentSplitPct: 80.0,
  networkPoolPct: 15.0,
  companySplitPct: 5.0,
  tierSplits: [40, 25, 15, 10, 10],
  brandingLogoUrl: null,
  brandingEmoji: '🏢',
};

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    let config = await this.prisma.globalConfig.findUnique({ where: { id: 'DEFAULT' } });
    if (!config) {
      config = await this.prisma.globalConfig.create({ data: DEFAULT_CONFIG });
    }
    return config;
  }

  async updateConfig(data: {
    commissionPoolPct?: number;
    agentSplitPct?: number;
    networkPoolPct?: number;
    companySplitPct?: number;
    tierSplits?: number[];
    brandingLogoUrl?: string;
    brandingEmoji?: string;
  }) {
    // Validate split percentages sum to 100 if all provided
    if (
      data.agentSplitPct !== undefined &&
      data.networkPoolPct !== undefined &&
      data.companySplitPct !== undefined
    ) {
      const total = data.agentSplitPct + data.networkPoolPct + data.companySplitPct;
      if (Math.abs(total - 100) > 0.01) {
        throw new Error(`agentSplitPct + networkPoolPct + companySplitPct must equal 100 (got ${total})`);
      }
    }
    if (data.tierSplits) {
      const tierTotal = data.tierSplits.reduce((a, b) => a + b, 0);
      if (Math.abs(tierTotal - 100) > 0.01) {
        throw new Error(`tierSplits must sum to 100 (got ${tierTotal})`);
      }
    }

    return this.prisma.globalConfig.upsert({
      where: { id: 'DEFAULT' },
      create: { ...DEFAULT_CONFIG, ...data },
      update: data,
    });
  }

  async getTierSplits(): Promise<number[]> {
    const config = await this.getConfig();
    return config.tierSplits as number[];
  }

  async getCommissionSplits() {
    const config = await this.getConfig();
    return {
      commissionPoolPct: config.commissionPoolPct,
      agentSplitPct: config.agentSplitPct / 100,
      networkPoolPct: config.networkPoolPct / 100,
      companySplitPct: config.companySplitPct / 100,
      tierSplits: (config.tierSplits as number[]).map(t => t / 100),
    };
  }
}
