import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompanyInviteService } from './company-invite.service';

// Public route — no auth guard
@Controller('company-invites')
export class CompanyInvitePublicController {
  constructor(private readonly companyInviteService: CompanyInviteService) {}

  @Get('validate/:token')
  validateInvite(@Param('token') token: string) {
    return this.companyInviteService.validateInvite(token);
  }
}

// Protected routes — admin only
@Controller('company-invites')
@UseGuards(AuthGuard('jwt'))
export class CompanyInviteController {
  constructor(private readonly companyInviteService: CompanyInviteService) {}

  @Get()
  listInvites() {
    return this.companyInviteService.listInvites();
  }

  @Post()
  createInvite(@Request() req, @Body() body: { email?: string; note?: string }) {
    return this.companyInviteService.createInvite(req.user.sub || req.user.id, body.email, body.note);
  }

  @Delete(':id')
  deleteInvite(@Param('id') id: string) {
    return this.companyInviteService.deleteInvite(id);
  }
}
