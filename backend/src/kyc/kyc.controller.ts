import { Controller, Post, Body, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { KycService } from './kyc.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('kyc')
@UseGuards(AuthGuard('jwt'))
export class KycController {
  constructor(private readonly kycService: KycService) {}

  // Any authenticated user can submit their KYC
  @Post('submit')
  async submitKyc(@Request() req, @Body() body: { aadhaarNumber: string, panNumber: string, selfieUrl: string }) {
    const userId = req.user.id || req.user.sub;
    return this.kycService.submitKyc(userId, body);
  }

  // Admin logic to manually verify uploaded documents
  @Patch('verify/:userId')
  async verifyKyc(@Param('userId') userId: string, @Body() body: { isVerified: boolean }) {
    return this.kycService.verifyKyc(userId, body.isVerified);
  }
}
