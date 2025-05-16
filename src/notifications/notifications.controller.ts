import { Controller } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationsService) {}
}
