import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NetworkNode {
  id: string;
  email: string;
  role: string;
  status: string;
  inviteCode: string;
  joinedAt: Date;
  level: number;
  stats: {
    leadsCount: number;
    activeLeads: number;
    dealsCount: number;
    visitsCount: number;
    walletBalance: number;
    lastActivityAt: Date | null;
    performanceScore: number; // 0-100
  };
  children: NetworkNode[];
}

export interface ActivityEvent {
  type: 'LEAD_CREATED' | 'LEAD_STAGE_CHANGED' | 'DEAL_CLOSED' | 'VISIT_SCHEDULED' | 'VISIT_COMPLETED';
  agentId: string;
  agentEmail: string;
  level: number;
  title: string;
  detail: string;
  timestamp: Date;
  meta: Record<string, any>;
}

@Injectable()
export class NetworkService {
  constructor(private prisma: PrismaService) {}

  // ── BFS: collect all downline IDs level-by-level (up to 5 levels) ─────────
  async getAllDownlineIds(agentId: string, maxDepth = 5): Promise<Map<string, number>> {
    // Maps userId → level
    const idLevelMap = new Map<string, number>();
    let currentLevel = [agentId];

    for (let depth = 1; depth <= maxDepth; depth++) {
      const children = await this.prisma.user.findMany({
        where: { referredById: { in: currentLevel } },
        select: { id: true },
      });
      if (children.length === 0) break;
      const nextLevel = children.map(c => c.id);
      for (const id of nextLevel) idLevelMap.set(id, depth);
      currentLevel = nextLevel;
    }

    return idLevelMap;
  }

  // ── Get stats for a single node ───────────────────────────────────────────
  private async getNodeStats(userId: string) {
    const [leads, deals, visits, wallet] = await Promise.all([
      this.prisma.lead.findMany({
        where: { agentId: userId },
        select: { stage: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.deal.count({ where: { agentId: userId } }),
      this.prisma.visit.count({ where: { agentId: userId } }),
      this.prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
    ]);

    const activeLeads = leads.filter(l => !['DEAL_CLOSED', 'LOST'].includes(l.stage)).length;
    const lastActivityAt = leads[0]?.updatedAt ?? null;

    // Performance score: weighted formula
    // Deals closed (40%), active pipeline (30%), conversion rate (30%)
    const conversionRate = leads.length > 0 ? (deals / leads.length) : 0;
    const pipelineScore = Math.min(activeLeads * 5, 30);
    const dealScore = Math.min(deals * 8, 40);
    const convScore = Math.round(conversionRate * 30);
    const performanceScore = Math.min(dealScore + pipelineScore + convScore, 100);

    return {
      leadsCount: leads.length,
      activeLeads,
      dealsCount: deals,
      visitsCount: visits,
      walletBalance: wallet?.balance ?? 0,
      lastActivityAt,
      performanceScore,
    };
  }

  // ── Recursive tree builder ────────────────────────────────────────────────
  async getTreeNode(userId: string, level = 1, maxLevel = 5): Promise<NetworkNode> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true, inviteCode: true, createdAt: true },
    });

    const stats = await this.getNodeStats(userId);

    let children: NetworkNode[] = [];
    if (level < maxLevel) {
      const direct = await this.prisma.user.findMany({
        where: { referredById: userId },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      children = await Promise.all(direct.map(d => this.getTreeNode(d.id, level + 1, maxLevel)));
    }

    return {
      id: user!.id,
      email: user!.email,
      role: user!.role,
      status: user!.status,
      inviteCode: user!.inviteCode,
      joinedAt: user!.createdAt,
      level,
      stats,
      children,
    };
  }

  // ── Full network summary stats ────────────────────────────────────────────
  async getNetworkSummary(agentId: string) {
    const idLevelMap = await this.getAllDownlineIds(agentId);
    const allIds = Array.from(idLevelMap.keys());

    if (allIds.length === 0) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        totalLeads: 0,
        totalDeals: 0,
        totalNetworkEarnings: 0,
        levelBreakdown: [],
        atRiskCount: 0,
        risingStarCount: 0,
      };
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [users, leads, deals, wallets] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: allIds } },
        select: { id: true, status: true },
      }),
      this.prisma.lead.findMany({
        where: { agentId: { in: allIds } },
        select: { agentId: true, stage: true, updatedAt: true },
      }),
      this.prisma.deal.findMany({
        where: { agentId: { in: allIds } },
        select: { agentId: true, salePrice: true, totalCommission: true },
      }),
      this.prisma.wallet.findMany({
        where: { userId: { in: allIds } },
        select: { userId: true, balance: true },
      }),
    ]);

    const activeMembers = users.filter(u => u.status === 'ACTIVE').length;
    const totalNetworkEarnings = wallets.reduce((s, w) => s + w.balance, 0);

    // Level breakdown (1-5)
    const levelBreakdown = [];
    for (let l = 1; l <= 5; l++) {
      const levelIds = allIds.filter(id => idLevelMap.get(id) === l);
      const levelLeads = leads.filter(lead => levelIds.includes(lead.agentId)).length;
      const levelDeals = deals.filter(deal => levelIds.includes(deal.agentId)).length;
      if (levelIds.length > 0) {
        levelBreakdown.push({ level: l, members: levelIds.length, leads: levelLeads, deals: levelDeals });
      }
    }

    // At-risk: active agents with no lead activity in 7+ days
    const agentLastActivity = new Map<string, Date>();
    for (const lead of leads) {
      const cur = agentLastActivity.get(lead.agentId);
      if (!cur || lead.updatedAt > cur) agentLastActivity.set(lead.agentId, lead.updatedAt);
    }
    const atRiskCount = users.filter(u => {
      if (u.status !== 'ACTIVE') return false;
      const last = agentLastActivity.get(u.id);
      return !last || last < sevenDaysAgo;
    }).length;

    // Rising stars: agents with ≥2 deals
    const dealsByAgent = new Map<string, number>();
    for (const d of deals) dealsByAgent.set(d.agentId, (dealsByAgent.get(d.agentId) ?? 0) + 1);
    const risingStarCount = Array.from(dealsByAgent.values()).filter(c => c >= 2).length;

    return {
      totalMembers: allIds.length,
      activeMembers,
      totalLeads: leads.length,
      totalDeals: deals.length,
      totalNetworkEarnings,
      levelBreakdown,
      atRiskCount,
      risingStarCount,
    };
  }

  // ── Activity feed from all downline ───────────────────────────────────────
  async getActivityFeed(agentId: string, limit = 50): Promise<ActivityEvent[]> {
    const idLevelMap = await this.getAllDownlineIds(agentId);
    const allIds = Array.from(idLevelMap.keys());

    if (allIds.length === 0) return [];

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days

    const [agents, leads, deals, visits] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: allIds } },
        select: { id: true, email: true },
      }),
      this.prisma.lead.findMany({
        where: { agentId: { in: allIds }, updatedAt: { gte: since } },
        select: { id: true, agentId: true, buyerName: true, stage: true, createdAt: true, updatedAt: true, propertyId: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      this.prisma.deal.findMany({
        where: { agentId: { in: allIds }, createdAt: { gte: since } },
        include: { property: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.visit.findMany({
        where: { agentId: { in: allIds }, updatedAt: { gte: since } },
        include: { property: { select: { title: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
    ]);

    const agentEmailMap = new Map(agents.map(a => [a.id, a.email]));

    const events: ActivityEvent[] = [];

    // Lead creation events
    for (const lead of leads) {
      const email = agentEmailMap.get(lead.agentId) ?? lead.agentId;
      const level = idLevelMap.get(lead.agentId) ?? 0;

      // Was this just created? (within 1 hour of createdAt matches updatedAt)
      const isNew = Math.abs(lead.createdAt.getTime() - lead.updatedAt.getTime()) < 3600000;

      if (isNew) {
        events.push({
          type: 'LEAD_CREATED',
          agentId: lead.agentId,
          agentEmail: email,
          level,
          title: `New lead added`,
          detail: `${email.split('@')[0]} added ${lead.buyerName} as a new lead`,
          timestamp: lead.createdAt,
          meta: { leadId: lead.id, buyerName: lead.buyerName, stage: lead.stage },
        });
      } else {
        events.push({
          type: 'LEAD_STAGE_CHANGED',
          agentId: lead.agentId,
          agentEmail: email,
          level,
          title: `Lead progressed`,
          detail: `${email.split('@')[0]}'s lead "${lead.buyerName}" → ${lead.stage.replace(/_/g, ' ')}`,
          timestamp: lead.updatedAt,
          meta: { leadId: lead.id, buyerName: lead.buyerName, stage: lead.stage },
        });
      }
    }

    // Deal closed events
    for (const deal of deals) {
      const email = agentEmailMap.get(deal.agentId) ?? deal.agentId;
      const level = idLevelMap.get(deal.agentId) ?? 0;
      events.push({
        type: 'DEAL_CLOSED',
        agentId: deal.agentId,
        agentEmail: email,
        level,
        title: `Deal closed 🎉`,
        detail: `${email.split('@')[0]} closed a deal on "${deal.property.title}"`,
        timestamp: deal.createdAt,
        meta: { dealId: deal.id, propertyTitle: deal.property.title, salePrice: deal.salePrice },
      });
    }

    // Visit events
    for (const visit of visits) {
      const email = agentEmailMap.get(visit.agentId) ?? visit.agentId;
      const level = idLevelMap.get(visit.agentId) ?? 0;
      const isCompleted = visit.status === 'COMPLETED';
      events.push({
        type: isCompleted ? 'VISIT_COMPLETED' : 'VISIT_SCHEDULED',
        agentId: visit.agentId,
        agentEmail: email,
        level,
        title: isCompleted ? 'Visit completed' : 'Visit scheduled',
        detail: `${email.split('@')[0]} ${isCompleted ? 'completed' : 'scheduled'} a visit to "${visit.property.title}"`,
        timestamp: visit.updatedAt,
        meta: { visitId: visit.id, propertyTitle: visit.property.title, status: visit.status },
      });
    }

    // Sort by timestamp desc, limit
    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // ── Upline chain (for notifications) ─────────────────────────────────────
  async getUplineChain(userId: string, maxDepth = 5): Promise<string[]> {
    const chain: string[] = [];
    let currentId = userId;
    for (let i = 0; i < maxDepth; i++) {
      const user = await this.prisma.user.findUnique({
        where: { id: currentId },
        select: { referredById: true },
      });
      if (!user?.referredById) break;
      chain.push(user.referredById);
      currentId = user.referredById;
    }
    return chain;
  }
}
