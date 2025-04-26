import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserRole } from './interfaces/user.interface';
import { RegisterDto } from '../auth/dto/register.dto';
import { RegisterCustomerDto } from 'src/auth/dto/register-customer.dto';
import { encryptPassword } from 'src/helpers/password-helper';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const newUser = new this.userModel({
      role: UserRole.CUSTOMER, // Default role is customer
      ...registerDto,
      isVerified: false,
      createdAt: new Date(),
    });
    return await newUser.save();
  }

  async createCustomer(registerDto: RegisterCustomerDto): Promise<User> {
    const password = await encryptPassword(registerDto.password);
    const newUser = new this.userModel({
      role: UserRole.CUSTOMER, // Default role is customer
      ...registerDto,
      password,
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

  async findAndUpdateById(_id: string, object: any): Promise<User> {
    if (object?.email) {
      const checkIfEmailExists = await this.userModel.find({
        email: object?.email,
      });
      if (checkIfEmailExists.length) {
        if (checkIfEmailExists[0]._id.toString() !== _id) {
          throw new HttpException(
            'User with this email already exists',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }
    const isUser = await this.userModel
      .findByIdAndUpdate(_id, { ...object }, { new: true })
      .exec();
    let user = isUser as User;
    return user;
  }

  async findAndUpdateByPhone(phoneNumber: string): Promise<User> {
    // const user = await this.userModel
    //   .findOneAndUpdate({ phoneNumber }, { phoneNumber }, { new: true })
    //   .exec();
    const isUser = await this.userModel.findOne({ phoneNumber }).exec();
    let user = isUser as User;
    if (!isUser) {
      user = await this.create({ phoneNumber });
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async updateVerificationStatus(
    userId: string | Types.ObjectId,
    isVerified: boolean,
  ): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(userId, { isVerified }, { new: true })
      .exec();
  }

  async updateRole(
    userId: string | Types.ObjectId,
    role: UserRole,
  ): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(userId, { role }, { new: true })
      .exec();
  }
}
