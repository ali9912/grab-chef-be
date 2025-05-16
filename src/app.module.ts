import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AchievementsModule } from './achievements/achievements.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BannersModule } from './banners/banners.module';
import { ChefModule } from './chef/chef.module';
import { CustomerModule } from './customer/customer.module';
import { EventModule } from './event/event.module';
import { MenuModule } from './menu/menu.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewModule } from './review/review.module';
import { UsersModule } from './users/users.module';
import { NotificationsService } from './notifications/notifications.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        },
      ],
    }),
    AuthModule,
    UsersModule,
    ChefModule,
    CustomerModule,
    EventModule,
    ReviewModule,
    MenuModule,
    AchievementsModule,
    BannersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, NotificationsService],
  exports: [AppService],
})
export class AppModule {}
