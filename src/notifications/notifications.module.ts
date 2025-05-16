import { Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { config } from 'dotenv';
import { NotificationController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

config();

@Module({
  imports: [],
  providers: [NotificationsService],
  controllers: [NotificationController],
  exports: [NotificationsService],
})
export class NotificationsModule {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}
