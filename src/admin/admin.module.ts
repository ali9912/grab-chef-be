import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ChefSchema } from 'src/chef/schemas/chef.schema';
import { CustomerSchema } from 'src/customer/schemas/customer.schema';
import { EventSchema } from 'src/event/schemas/event.schema';
import { MenuSchema } from 'src/menu/schemas/menu.schema';
import { UserSchema } from 'src/users/schemas/user.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ReviewSchema } from 'src/review/schemas/review.schema';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '1d'),
        },
      }),
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Chef', schema: ChefSchema }]),
    MongooseModule.forFeature([{ name: 'Customer', schema: CustomerSchema }]),
    MongooseModule.forFeature([{ name: 'Menu', schema: MenuSchema }]),
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }]),
    MongooseModule.forFeature([{ name: 'Review', schema: ReviewSchema }]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }
