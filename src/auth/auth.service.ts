import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { ChefAuthDto, RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { Otp } from './interfaces/otp.interface';
import { User, UserRole } from '../users/interfaces/user.interface';
import { TwilioService } from '../utils/twilio.service';
import { CreatePasswordDto } from './dto/create-password.dto';
import { LoginWithPhoneDto } from './dto/signup-with-phone.dto';
import { comparePassword, encryptPassword } from 'src/helpers/password-helper';
import { EditChefDto } from './dto/edit-chef.dto';
import { ChefService } from 'src/chef/chef.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly twilioService: TwilioService,
    private readonly chefService: ChefService,
    @InjectModel('Otp') private readonly otpModel: Model<Otp>,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async chefAuth(chefAuthDto: ChefAuthDto) {
    const { phoneNumber } = chefAuthDto;
    // check if the user exists in the database
    const user = await this.usersService.findByPhone(phoneNumber);
    if (!user) {
      const newUser = await this.usersService.create({
        phoneNumber,
        role: UserRole.CHEF,
      });
      console.log('===newUser===>', JSON.stringify(newUser, null, 1));
    }
    // Generate and Send the OTP
    const { code, message } = await this.sendOtp(phoneNumber);
    return { status: 'success', message, code, newUser: !user };
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
      user,
    };
  }

  async createPassword(createPasswordDto: CreatePasswordDto, userInfo: User) {
    const { password, confirmPassword } = createPasswordDto;
    const userId = userInfo?._id.toString();

    if (!userId) {
      throw new HttpException('No user id provided', HttpStatus.BAD_REQUEST);
    }

    // Find user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // check for password match
    if (password !== confirmPassword) {
      throw new HttpException('Passwords donot match', HttpStatus.BAD_REQUEST);
    }

    // encrypt the password
    const hashedPassword = await encryptPassword(password);

    const userPass = await this.usersService.findAndUpdateById(userId, {
      password: hashedPassword,
    });

    console.log('===userPass===>', JSON.stringify(userPass, null, 1));

    return { message: 'Password created successfully', success: true };
  }

  async editChefProfile(body: EditChefDto, userInfo: User) {
    const userId = userInfo?._id?.toString();

    // Check if user exists
    const userExists = await this.usersService.findById(userId);
    if (!userExists) {
      throw new HttpException('User donot exists', HttpStatus.BAD_REQUEST);
    }

    // Update User
    let newUser = await this.usersService.findAndUpdateById(userId, body);
    const chef = await this.chefService.findAndUpdateChefByUserId(userId, body);
    newUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          chef: chef?._id,
        },
        { new: true },
      )
      .populate('chef');

    return {
      success: true,
      message: 'Chef profile updated successfully',
      user: newUser,
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const userExists = await this.usersService.findByPhone(
      registerDto.phoneNumber,
    );
    if (userExists) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }
    // Create user
    const newUser = await this.usersService.create(registerDto);
    // Generate and send OTP
    const { code, message } = await this.sendOtp(newUser.phoneNumber);
    return { status: 'success', message, code };
  }

  async loginWithPhoneNumber(loginWithPhoneNumber: LoginWithPhoneDto) {
    const { phoneNumber } = loginWithPhoneNumber;
    let user = this.usersService.findAndUpdateByPhone(phoneNumber);
    const { code, message } = await this.sendOtp(phoneNumber);
    return { message, code };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throw new HttpException(
        'Invalid Password or email',
        HttpStatus.BAD_REQUEST,
      );
    }

    const token = this.generateToken(user);

    const updatedUser = await user.populate('chef');

    return {
      message: 'User authenticated successfully',
      user: updatedUser,
      token,
      success: true,
    };
  }

  private async sendOtp(phoneNumber: string) {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate expiry time (default 5 minutes)
    const expiryMinutes = this.configService.get<number>(
      'OTP_EXPIRY_MINUTES',
      5,
    );
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
      // await this.twilioService.sendSMS(phoneNumber, message);
      return { code: otpCode, message };
    } catch (error) {
      // If Twilio is not configured, we'll log the OTP for development purposes
      console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otpCode}`);
      return { code: otpCode };
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
