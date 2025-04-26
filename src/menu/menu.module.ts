import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuSchema } from './schemas/menu.schema';
import { ChefModule } from 'src/chef/chef.module';
import { ChefSchema } from 'src/chef/schemas/chef.schema';
import { UserSchema } from 'src/users/schemas/user.schema';

@Module({
  controllers: [MenuController],
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
    MongooseModule.forFeature([{ name: 'Menu', schema: MenuSchema }]),
    MongooseModule.forFeature([{ name: 'Chef', schema: ChefSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    ChefModule,
  ],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
