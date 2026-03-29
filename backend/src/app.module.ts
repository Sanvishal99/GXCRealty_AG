import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { CommissionModule } from './commission/commission.module';
import { DealsModule } from './deals/deals.module';
import { KycModule } from './kyc/kyc.module';
import { PropertiesModule } from './properties/properties.module';
import { VisitsModule } from './visits/visits.module';
import { ChatModule } from './chat/chat.module';
import { AppConfigModule } from './config/config.module';
import { LeadsModule } from './leads/leads.module';
import { WithdrawalModule } from './withdrawal/withdrawal.module';
import { CompanyInviteModule } from './company-invite/company-invite.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), // 100 requests per minute per IP
    PrismaModule,
    AppConfigModule,
    AnalyticsModule,
    AuthModule,
    UsersModule,
    WalletModule,
    CommissionModule,
    DealsModule,
    KycModule,
    PropertiesModule,
    VisitsModule,
    ChatModule,
    LeadsModule,
    WithdrawalModule,
    CompanyInviteModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
