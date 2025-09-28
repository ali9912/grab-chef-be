import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  MultipleDeviceNotificationDto,
  NotificationDto,
} from './dto/notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notifications } from './interfaces/notifications.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel('Notifications')
    private readonly notificationModel: Model<Notifications>,
  ) {}

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
    userId,
    data,
  }: MultipleDeviceNotificationDto) {
    const message = {
      notification: {
        title,
        body,
        icon,
      },
      data,
      tokens,
    };

    try {
      if (userId) {
        await this.notificationModel.create({
          user: userId,
          title,
          body,
          data,
        });
      }
      if (tokens.length == 0) {
        return { success: false, message: 'No Tokens' };
      }
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Successfully sent messages:', response.responses[0].error);
      return {
        success: true,
        message: `Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`,
      };
    } catch (error) {
      console.log('Error sending messages:', error);
      return { success: false, message: 'Failed to send notifications' };
    }
  }

  async getUserNotifications(userId: string) {
    // Get notifications with unread first, then by creation date descending
    const notifications = await this.notificationModel
      .find({ user: userId })
      .sort({ read: 1, createdAt: -1 }); // read: 1 means false first, createdAt: -1 means newest first
    
    // Mark all notifications as read
    await this.notificationModel.updateMany(
      { user: userId },
      { read: true }
    );
    
    return { notifications };
  }
}
