import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { UserSchema } from 'src/users/schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AchievementsSchema } from './schema/achievements.schema.';
import { ChefSchema } from 'src/chef/schemas/chef.schema';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Chef', schema: ChefSchema }]),
    MongooseModule.forFeature([
      { name: 'Achievements', schema: AchievementsSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
