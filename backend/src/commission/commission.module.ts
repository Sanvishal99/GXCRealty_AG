import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [UsersModule, WalletModule],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
