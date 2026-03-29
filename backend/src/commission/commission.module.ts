import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [UsersModule, WalletModule, AppConfigModule],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
