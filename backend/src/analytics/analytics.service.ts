import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Status, PropertyStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    const [
      totalUsers,
      usersByRole,
      usersByStatus,
      totalProperties,
      propertiesByStatus,
      totalDeals,
      dealRevenue,
      recentDeals,
      totalVisits,
      visitsByStatus,
      pendingKyc,
      recentUsers,
      monthlyRevenue,
    ] = await Promise.all([
      // Totals
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
      this.prisma.user.groupBy({ by: ['status'], _count: true }),
      this.prisma.property.count(),
      this.prisma.property.groupBy({ by: ['status'], _count: true }),
      this.prisma.deal.count(),

      // Deal revenue
      this.prisma.deal.aggregate({ _sum: { salePrice: true, totalCommission: true } }),

      // Recent 5 deals
      this.prisma.deal.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { title: true, city: true } },
          agent: { select: { email: true } },
        },
      }),

      // Visit stats
      this.prisma.visit.count(),
      this.prisma.visit.groupBy({ by: ['status'], _count: true }),

      // Pending KYC count
      this.prisma.user.count({ where: { status: Status.PENDING_KYC } }),

      // Recent 5 users
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, status: true, createdAt: true },
      }),

      // Monthly revenue last 6 months
      this.getMonthlyRevenue(),
    ]);

    return {
      users: {
        total: totalUsers,
        byRole: Object.fromEntries(usersByRole.map(r => [r.role, r._count])),
        byStatus: Object.fromEntries(usersByStatus.map(s => [s.status, s._count])),
        pendingKyc,
        recent: recentUsers,
      },
      properties: {
        total: totalProperties,
        byStatus: Object.fromEntries(propertiesByStatus.map(s => [s.status, s._count])),
      },
      deals: {
        total: totalDeals,
        totalRevenue: dealRevenue._sum.salePrice || 0,
        totalCommission: dealRevenue._sum.totalCommission || 0,
        recent: recentDeals,
      },
      visits: {
        total: totalVisits,
        byStatus: Object.fromEntries(visitsByStatus.map(s => [s.status, s._count])),
      },
      monthlyRevenue,
    };
  }

  async getAgentStats(agentId: string) {
    const [
      myDeals,
      myVisits,
      myLeads,
      wallet,
      myProperties,
    ] = await Promise.all([
      this.prisma.deal.findMany({
        where: { agentId },
        include: { property: { select: { title: true, city: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.visit.findMany({
        where: { agentId },
        include: { property: { select: { title: true } } },
        orderBy: { scheduledAt: 'desc' },
        take: 10,
      }),
      this.prisma.lead.groupBy({ by: ['stage'], where: { agentId }, _count: true }),
      this.prisma.wallet.findUnique({
        where: { userId: agentId },
        include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
      }),
      this.prisma.property.count({ where: { companyId: agentId } }),
    ]);

    const totalRevenue = myDeals.reduce((s, d) => s + d.salePrice, 0);
    const totalCommission = myDeals.reduce((s, d) => s + d.totalCommission * d.salePrice, 0);

    const monthlyDeals = await this.getAgentMonthlyDeals(agentId);

    return {
      deals: {
        total: myDeals.length,
        totalRevenue,
        totalCommission,
        recent: myDeals,
        monthly: monthlyDeals,
      },
      visits: {
        total: myVisits.length,
        byStatus: {
          PENDING: myVisits.filter(v => v.status === 'PENDING').length,
          APPROVED: myVisits.filter(v => v.status === 'APPROVED').length,
          COMPLETED: myVisits.filter(v => v.status === 'COMPLETED').length,
          REJECTED: myVisits.filter(v => v.status === 'REJECTED').length,
        },
        recent: myVisits,
      },
      leads: {
        byStage: Object.fromEntries(myLeads.map(l => [l.stage, l._count])),
        total: myLeads.reduce((s, l) => s + l._count, 0),
      },
      wallet: wallet
        ? { balance: wallet.balance, recentTransactions: wallet.transactions }
        : { balance: 0, recentTransactions: [] },
    };
  }

  private async getAgentMonthlyDeals(agentId: string) {
    const months: { month: string; revenue: number; deals: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const result = await this.prisma.deal.aggregate({
        where: { agentId, createdAt: { gte: start, lte: end } },
        _sum: { salePrice: true },
        _count: true,
      });

      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: result._sum.salePrice || 0,
        deals: result._count,
      });
    }

    return months;
  }

  async getAuditLogs(entity?: string, take = 100) {
    return this.prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  private async getMonthlyRevenue() {
    const months: { month: string; revenue: number; deals: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const result = await this.prisma.deal.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { salePrice: true },
        _count: true,
      });

      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: result._sum.salePrice || 0,
        deals: result._count,
      });
    }

    return months;
  }
}
