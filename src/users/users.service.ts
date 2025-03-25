import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserRole } from './interfaces/user.interface';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const newUser = new this.userModel({
      ...registerDto,
      role: UserRole.CUSTOMER, // Default role is customer
      isVerified: false,
      createdAt: new Date(),
    });
    return await newUser.save();
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async findByPhone(phoneNumber: string): Promise<User> {
    return this.userModel.findOne({ phoneNumber }).exec();
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async updateVerificationStatus(userId: string | Types.ObjectId, isVerified: boolean): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { isVerified },
      { new: true },
    ).exec();
  }

  async updateRole(userId: string | Types.ObjectId, role: UserRole): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    ).exec();
  }
}
