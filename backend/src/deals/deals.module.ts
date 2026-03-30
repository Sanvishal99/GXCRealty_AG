import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { CommissionModule } from '../commission/commission.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [CommissionModule, ChatModule],
  providers: [DealsService],
  controllers: [DealsController],
})
export class DealsModule {}
