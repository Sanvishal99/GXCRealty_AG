import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { CommissionModule } from '../commission/commission.module';

@Module({
  imports: [CommissionModule],
  providers: [DealsService],
  controllers: [DealsController],
})
export class DealsModule {}
