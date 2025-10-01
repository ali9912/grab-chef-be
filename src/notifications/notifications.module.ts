import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from 'dotenv';
import * as admin from 'firebase-admin';
import { MenuModule } from 'src/menu/menu.module';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsSchema } from './schemas/notification.schema';
var serviceAccount = require('../../grab-chef-service.json');

config();

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Notifications', schema: NotificationsSchema },
    ]),
    forwardRef(() => MenuModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationsService, NotificationSchedulerService],
  exports: [NotificationsService, NotificationSchedulerService],
})
export class NotificationsModule {
  constructor() {
    admin.initializeApp({
      // credential: admin.credential.cert({
      //   // projectId: process.env.FIREBASE_PROJECT_ID,
      //   // clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      //   // privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      //   projectId: process.env.FIREBASE_PROJECT_ID,
      //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      //   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      // }),
      credential: admin.credential.cert(serviceAccount),
    });
  }
}
