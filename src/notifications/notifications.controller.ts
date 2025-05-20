import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';
import { MultipleDeviceNotificationDto } from './dto/notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Get()
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

  @Post()
  async sendNotifications(
    @Req() req: RequestUser,
    @Body() body: MultipleDeviceNotificationDto,
  ) {
    try {
      // const userId = req.user._id.toString();
      return this.notificationService.sendNotificationToMultipleTokens(body);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get notifucations.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
