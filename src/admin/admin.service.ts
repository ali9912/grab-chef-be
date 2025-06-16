import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AdminLoginDTO } from './dtos/admin-login-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chef } from 'src/chef/interfaces/chef.interface';
import { MenuItem } from 'src/event/interfaces/event.interface';
import { ChefService } from 'src/chef/chef.service';
import { AchievementsService } from 'src/achievements/achievements.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { User, UserRole } from 'src/users/interfaces/user.interface';
import { JwtService } from '@nestjs/jwt';
import { AdminRegisterDTO } from './dtos/admin-register-dto';
import { comparePassword } from 'src/helpers/password-helper';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('Event') private readonly eventModel: Model<Event>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('Menu') private readonly menuModel: Model<MenuItem>,

    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(loginAdminDto: AdminLoginDTO) {
    const user = await this.userModel.findOne({
      email: loginAdminDto.email,
      role: UserRole.ADMIN,
    });
    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    const token = this.generateToken(user);

    return {
      token,
      user,
      message: 'Admin login successfully',
    };
  }

  async registerAdmin(adminRegisterDTO: AdminRegisterDTO) {
    const user = await this.userModel.findOne({
      email: adminRegisterDTO.email,
      role: UserRole.ADMIN,
    });
    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    const isMatch = await comparePassword(
      adminRegisterDTO.password,
      user.password,
    );

    if (!isMatch) {
      throw new HttpException(
        'Invalid Password or email',
        HttpStatus.BAD_REQUEST,
      );
    }

    const token = this.generateToken(user);

    return {
      token,
      user,
      message: 'Admin Registered successfully',
    };
  }

  private generateToken(user: User) {
    const payload = {
      sub: user._id,
      phone: user.phoneNumber,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
