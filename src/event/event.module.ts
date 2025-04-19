import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { CounterSchema, EventSchema } from './schemas/event.schema';
import { ChefModule } from '../chef/chef.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }]),
    MongooseModule.forFeature([{ name: 'Counter', schema: CounterSchema }]),
    ChefModule,
    CustomerModule,
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
