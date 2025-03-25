import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { Otp } from './interfaces/otp.interface';
import { User } from '../users/interfaces/user.interface';
import { TwilioService } from '../utils/twilio.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly twilioService: TwilioService,
    @InjectModel('Otp') private readonly otpModel: Model<Otp>,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const userExists = await this.usersService.findByPhone(registerDto.phoneNumber);
    if (userExists) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    // Create user
    const newUser = await this.usersService.create(registerDto);

    // Generate and send OTP
    await this.sendOtp(newUser.phoneNumber);

    return { message: 'OTP sent to phone number' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phoneNumber, otp } = verifyOtpDto;

    // Find user
    const user = await this.usersService.findByPhone(phoneNumber);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Verify OTP
    const otpRecord = await this.otpModel
      .findOne({
        phoneNumber,
        code: otp,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!otpRecord) {
      throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }

    // Update user verification status
    await this.usersService.updateVerificationStatus(user._id.toString(), true);

    // Delete OTP record
    await this.otpModel.deleteOne({ _id: otpRecord._id }).exec();

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      message: 'User verified and logged in',
    };
  }

  async login(loginDto: LoginDto) {
    const { phoneNumber } = loginDto;

    // Check if user exists
    const user = await this.usersService.findByPhone(phoneNumber);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Generate and send OTP
    await this.sendOtp(phoneNumber);

    return { message: 'OTP sent to phone number' };
  }

  private async sendOtp(phoneNumber: string) {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiry time (default 5 minutes)
    const expiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES', 5);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    // Save OTP to database
    await this.otpModel.create({
      phoneNumber,
      code: otpCode,
      expiresAt,
    });

    try {
      // Send OTP via Twilio
      const message = `Your Grab Chef verification code is: ${otpCode}. Valid for ${expiryMinutes} minutes.`;
      await this.twilioService.sendSMS(phoneNumber, message);
    } catch (error) {
      // If Twilio is not configured, we'll log the OTP for development purposes
      console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otpCode}`);
    }
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
