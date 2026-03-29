import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanyInviteService } from './company-invite.service';
import { CompanyInviteController, CompanyInvitePublicController } from './company-invite.controller';

@Module({
  imports: [PrismaModule],
  providers: [CompanyInviteService],
  controllers: [CompanyInviteController, CompanyInvitePublicController],
  exports: [CompanyInviteService],
})
export class CompanyInviteModule {}
