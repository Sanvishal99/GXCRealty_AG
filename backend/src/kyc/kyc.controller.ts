import { Controller, Post, Body, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { KycService } from './kyc.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('kyc')
@UseGuards(AuthGuard('jwt'))
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  async submitKyc(@Request() req, @Body() body: { aadhaarNumber: string, panNumber: string, selfieUrl: string }) {
    const userId = req.user.id || req.user.sub;
    return this.kycService.submitKyc(userId, body);
  }

  // Only ADMIN can verify KYC documents
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('verify/:userId')
  async verifyKyc(@Param('userId') userId: string, @Body() body: { isVerified: boolean, rejectionReason?: string }) {
    return this.kycService.verifyKyc(userId, body.isVerified, body.rejectionReason);
  }
}
