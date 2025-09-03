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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';
import { MultipleDeviceNotificationDto } from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationsService,
    private readonly notificationSchedulerService: NotificationSchedulerService,
  ) {}

  @ApiBearerAuth('JWT-auth')
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

  @ApiBearerAuth('JWT-auth')
  @Post('trigger-random-dish-notifications')
  @UseGuards(JwtAuthGuard)
  async triggerRandomDishNotifications() {
    try {
      // This endpoint can be called by admins or for testing purposes
      return this.notificationSchedulerService.triggerRandomNotifications();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to trigger random dish notifications.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiBearerAuth('JWT-auth')
  @Get('scheduler-status')
  @UseGuards(JwtAuthGuard)
  async getSchedulerStatus() {
    try {
      return this.notificationSchedulerService.getNextScheduledTimes();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get scheduler status.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
