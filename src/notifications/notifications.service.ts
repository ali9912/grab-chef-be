import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  MultipleDeviceNotificationDto,
  NotificationDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  async sendNotification({ token, title, body, data, icon }: NotificationDto) {
    try {
      const response = await admin.messaging().send({
        token,
        webpush: {},
        notification: {
          title,
          body,
        },
        data,
      });
      console.log(
        '===NOTIFICATION RESPONSE===>',
        JSON.stringify(response, null, 1),
      );
      return response;
    } catch (error) {
      console.log('===error===>', JSON.stringify(error, null, 1));
    }
  }

  async sendNotificationToMultipleTokens({
    tokens,
    title,
    body,
    icon,
  }: MultipleDeviceNotificationDto) {
    const message = {
      notification: {
        title,
        body,
        icon,
      },
      tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Successfully sent messages:', response);
      return {
        success: true,
        message: `Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`,
      };
    } catch (error) {
      console.log('Error sending messages:', error);
      return { success: false, message: 'Failed to send notifications' };
    }
  }
}
