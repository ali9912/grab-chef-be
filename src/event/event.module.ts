import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { CounterSchema, EventSchema } from './schemas/event.schema';
import { ChefModule } from '../chef/chef.module';
import { CustomerModule } from '../customer/customer.module';
import { UserSchema } from 'src/users/schemas/user.schema';
import { ChefSchema } from 'src/chef/schemas/chef.schema';
import { AchievementsModule } from 'src/achievements/achievements.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }]),
    MongooseModule.forFeature([{ name: 'Counter', schema: CounterSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Chef', schema: ChefSchema }]),
    ChefModule,
    CustomerModule,
    AchievementsModule,
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
