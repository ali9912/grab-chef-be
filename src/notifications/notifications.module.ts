import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from 'dotenv';
import * as admin from 'firebase-admin';
import { NotificationController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsSchema } from './schemas/notification.schema';

config();

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Notifications', schema: NotificationsSchema },
    ]),
  ],
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
