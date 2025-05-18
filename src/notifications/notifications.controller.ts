import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getMenuList(@Req() req: RequestUser) {
    try {
      const userId = req.user._id.toString();
      return this.notificationService.getUserNotifications(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get notifucations.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
