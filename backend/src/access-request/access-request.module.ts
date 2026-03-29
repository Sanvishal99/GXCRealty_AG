import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessRequestService } from './access-request.service';
import { AccessRequestPublicController, AccessRequestAdminController } from './access-request.controller';

@Module({
  imports: [PrismaModule],
  providers: [AccessRequestService],
  controllers: [AccessRequestPublicController, AccessRequestAdminController],
})
export class AccessRequestModule {}
