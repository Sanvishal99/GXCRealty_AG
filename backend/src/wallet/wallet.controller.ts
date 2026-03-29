import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@Request() req) {
    return this.walletService.getWalletForUser(req.user.id);
  }

  @Post('withdraw')
  async withdraw(@Request() req, @Body() body: { amount: number }) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than zero');
    }
    return this.walletService.withdraw(req.user.id, body.amount);
  }
}
