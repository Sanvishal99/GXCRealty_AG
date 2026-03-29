import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WithdrawalStatus } from '@prisma/client';
import { WithdrawalService } from './withdrawal.service';

@UseGuards(AuthGuard('jwt'))
@Controller('withdrawals')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get()
  async getRequests(@Request() req, @Query('status') status?: WithdrawalStatus) {
    const userId = req.user.id || req.user.sub;
    const role = req.user.role;

    if (role === 'ADMIN') {
      return this.withdrawalService.getAllRequests(status);
    }
    return this.withdrawalService.getMyRequests(userId);
  }

  @Post()
  async requestWithdrawal(
    @Request() req,
    @Body()
    body: {
      amount: number;
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      accountName?: string;
      upiId?: string;
    },
  ) {
    const userId = req.user.id || req.user.sub;
    const { amount, bankName, accountNumber, ifscCode, accountName, upiId } = body;
    return this.withdrawalService.requestWithdrawal(userId, amount, {
      bankName,
      accountNumber,
      ifscCode,
      accountName,
      upiId,
    });
  }

  @Patch(':id')
  async processRequest(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT' | 'PAY'; adminNote?: string },
  ) {
    const role = req.user.role;
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can process withdrawal requests');
    }
    const adminId = req.user.id || req.user.sub;
    return this.withdrawalService.processRequest(id, adminId, body.action, body.adminNote);
  }
}
