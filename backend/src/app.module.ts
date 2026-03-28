import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { CommissionModule } from './commission/commission.module';
import { DealsModule } from './deals/deals.module';
import { KycModule } from './kyc/kyc.module';
import { PropertiesModule } from './properties/properties.module';
import { VisitsModule } from './visits/visits.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    UsersModule, 
    WalletModule, 
    CommissionModule, 
    DealsModule,
    KycModule,
    PropertiesModule,
    VisitsModule,
    ChatModule
  ],
})
export class AppModule {}
