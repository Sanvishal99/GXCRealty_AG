import { Module } from '@nestjs/common';
import { AnalyticsController, AgentAnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController, AgentAnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
