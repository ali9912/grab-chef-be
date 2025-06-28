import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto, AttachFileDto } from './dto/message.dto';
import { RequestUser } from '../auth/interfaces/request-user.interface';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  async sendMessage(@Req() req: RequestUser, @Body() sendMessageDto: SendMessageDto) {
    const senderId = req.user._id.toString();
    return this.chatService.sendMessage(senderId, sendMessageDto);
  }

  @Post('attach')
  async attachFile(@Req() req: RequestUser, @Body() attachFileDto: AttachFileDto) {
    const senderId = req.user._id.toString();
    return this.chatService.attachFile(senderId, attachFileDto);
  }

  @Get('history')
  async getChatHistory(@Req() req: RequestUser, @Query('userId') userId: string) {
    const currentUserId = req.user._id.toString();
    return this.chatService.getChatHistory(currentUserId, userId);
  }

  @Get('my-chats')
  async listMyChats(@Req() req: RequestUser) {
    const userId = req.user._id.toString();
    return this.chatService.listMyChats(userId);
  }
} 