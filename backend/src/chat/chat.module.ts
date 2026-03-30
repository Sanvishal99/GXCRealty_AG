import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [JwtModule, PrismaModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway], // exported so other modules can call emitToUser
})
export class ChatModule {}
